package io.github.pkjpathania.dependencyrisk.workbench.assistant.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import dev.langchain4j.model.TokenCountEstimator;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiTokenCountEstimator;
import graphql.ExecutionResult;
import io.github.pkjpathania.dependencyrisk.workbench.config.BuggyOrchestrationProperties;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.graphql.ExecutionGraphQlService;
import org.springframework.graphql.ExecutionGraphQlResponse;
import reactor.core.publisher.Mono;
import tools.jackson.databind.ObjectMapper;

class GraphQlBuggyAssistantServiceTest {
  private static final String SCHEMA =
      """
      type Query {
        applicationOccurrences: [ApplicationOccurrence!]!
      }

      type ApplicationOccurrence {
        id: ID!
        name: String
      }
      """;

  private final ChatModel chatModel = org.mockito.Mockito.mock(ChatModel.class);
  private final ExecutionGraphQlService graphQlService =
      org.mockito.Mockito.mock(ExecutionGraphQlService.class);

  @Test
  void sendsTheCompleteSchemaAndQuestionToTheModel() {
    when(chatModel.chat(anyString())).thenReturn("mutation { removeEverything }");
    GraphQlBuggyAssistantService service = service();

    assertThrows(
        IllegalArgumentException.class,
        () -> service.ask("Which applications are vulnerable?"));

    ArgumentCaptor<String> prompt = ArgumentCaptor.forClass(String.class);
    verify(chatModel, times(2)).chat(prompt.capture());
    assertTrue(prompt.getAllValues().getFirst().contains(SCHEMA.trim()));
    assertTrue(
        prompt.getAllValues().getFirst().contains("Which applications are vulnerable?"));
    assertTrue(prompt.getAllValues().getFirst().contains("Never guess an RDF IRI"));
    verifyNoInteractions(graphQlService);
  }

  @Test
  void rejectsBlankQuestionsBeforeCallingTheModel() {
    GraphQlBuggyAssistantService service = service();

    IllegalArgumentException error =
        assertThrows(IllegalArgumentException.class, () -> service.ask("  "));

    assertEquals("Question must not be blank", error.getMessage());
    verifyNoInteractions(chatModel, graphQlService);
  }

  @Test
  void routesOversizedResultsThroughBoundedJsonlFragments() {
    TokenCountEstimator tokenEstimator = mock(TokenCountEstimator.class);
    when(tokenEstimator.estimateTokenCountInText(anyString()))
        .thenAnswer(invocation -> invocation.<String>getArgument(0).length());
    BuggyOrchestrationProperties properties =
        new BuggyOrchestrationProperties("gpt-4", 4_000, 500, 2_500, 100);

    ExecutionGraphQlResponse graphQlResponse = mock(ExecutionGraphQlResponse.class);
    ExecutionResult executionResult = mock(ExecutionResult.class);
    when(graphQlService.execute(any())).thenReturn(Mono.just(graphQlResponse));
    when(graphQlResponse.getExecutionResult()).thenReturn(executionResult);
    when(executionResult.getErrors()).thenReturn(List.of());
    when(executionResult.toSpecification())
        .thenReturn(Map.of("data", Map.of("applicationOccurrences", "x".repeat(10_000))));

    when(chatModel.chat(anyString()))
        .thenAnswer(
            invocation -> {
              String prompt = invocation.getArgument(0);
              if (prompt.contains("Create exactly one read-only GraphQL query")) {
                return "query { applicationOccurrences { id name } }";
              }
              if (prompt.contains("Extract only facts")) {
                return "{\"application\":\"relevant\"}";
              }
              return "The relevant application was found.";
            });

    String answer = service(tokenEstimator, properties).ask("Which application is relevant?");

    assertEquals("The relevant application was found.", answer);
    ArgumentCaptor<String> prompts = ArgumentCaptor.forClass(String.class);
    verify(chatModel, org.mockito.Mockito.atLeast(3)).chat(prompts.capture());
    assertTrue(
        prompts.getAllValues().stream()
            .allMatch(prompt -> prompt.length() <= properties.inputBudget()));
    assertTrue(
        prompts.getAllValues().stream()
            .anyMatch(prompt -> prompt.contains("GraphQL-result fragment")));
    assertTrue(
        prompts.getAllValues().stream()
            .anyMatch(prompt -> prompt.contains("compact JSONL evidence")));
  }

  private GraphQlBuggyAssistantService service() {
    return service(
        new OpenAiTokenCountEstimator("gpt-4o-mini"),
        new BuggyOrchestrationProperties("gpt-4", 128_000, 4_096, 24_000, 768));
  }

  private GraphQlBuggyAssistantService service(
      TokenCountEstimator tokenEstimator, BuggyOrchestrationProperties properties) {
    return new GraphQlBuggyAssistantService(
        chatModel,
        graphQlService,
        new ObjectMapper(),
        tokenEstimator,
        properties,
        new ByteArrayResource(SCHEMA.getBytes(StandardCharsets.UTF_8)));
  }
}
