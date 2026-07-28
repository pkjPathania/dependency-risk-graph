package io.github.pkjpathania.dependencyrisk.workbench.assistant.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import dev.langchain4j.model.chat.ChatModel;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.graphql.ExecutionGraphQlService;
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

  private GraphQlBuggyAssistantService service() {
    return new GraphQlBuggyAssistantService(
        chatModel,
        graphQlService,
        new ObjectMapper(),
        new ByteArrayResource(SCHEMA.getBytes(StandardCharsets.UTF_8)));
  }
}
