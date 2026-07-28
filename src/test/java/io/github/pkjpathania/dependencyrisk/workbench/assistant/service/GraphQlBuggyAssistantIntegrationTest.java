package io.github.pkjpathania.dependencyrisk.workbench.assistant.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import dev.langchain4j.model.chat.ChatModel;
import io.github.pkjpathania.dependencyrisk.workbench.config.BuggyAssistantService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(
    properties =
        "dependency-risk.graph-db.path=target/test-data/graphql-buggy-assistant-integration")
class GraphQlBuggyAssistantIntegrationTest {
  @Autowired private BuggyAssistantService assistantService;
  @MockitoBean private ChatModel chatModel;

  @Test
  void executesTheGeneratedQueryAndGroundsTheFinalAnswerInItsResult() {
    when(chatModel.chat(anyString()))
        .thenReturn(
            """
            ```graphql
            query {
              applicationOccurrence(id: "urn:test:missing") { id name }
            }
            ```
            """,
            "No matching application was found in the dependency graph.");

    String answer = assistantService.ask("Is urn:test:missing vulnerable?");

    assertEquals("No matching application was found in the dependency graph.", answer);
    ArgumentCaptor<String> prompts = ArgumentCaptor.forClass(String.class);
    org.mockito.Mockito.verify(chatModel, org.mockito.Mockito.times(2)).chat(prompts.capture());
    List<String> values = prompts.getAllValues();
    assertTrue(values.get(0).contains("type Query"));
    assertTrue(values.get(0).contains("Is urn:test:missing vulnerable?"));
    assertTrue(values.get(1).contains("Executed GraphQL query"));
    assertTrue(values.get(1).contains("\"applicationOccurrence\":null"));
  }

  @Test
  void repairsAQueryThatUsesAnApplicationNameAsAnId() {
    when(chatModel.chat(anyString()))
        .thenReturn(
            """
            query {
              applicationOccurrence(id: "iceberg") { vulnerabilities { id } }
            }
            """,
            """
            query {
              applicationOccurrences {
                id
                name
                vulnerabilities { id }
              }
            }
            """,
            "No application named iceberg was found in the dependency graph.");

    String answer = assistantService.ask("Is iceberg affected by any vulnerability?");

    assertEquals("No application named iceberg was found in the dependency graph.", answer);
    ArgumentCaptor<String> prompts = ArgumentCaptor.forClass(String.class);
    org.mockito.Mockito.verify(chatModel, org.mockito.Mockito.times(3)).chat(prompts.capture());
    assertTrue(
        prompts
            .getAllValues()
            .get(1)
            .contains("The generated id 'iceberg' is not an exact RDF IRI"));
    assertTrue(prompts.getAllValues().get(2).contains("applicationOccurrences"));
  }
}
