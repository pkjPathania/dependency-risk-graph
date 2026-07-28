package io.github.pkjpathania.dependencyrisk.workbench.assistant.service;

import dev.langchain4j.model.chat.ChatModel;
import graphql.ExecutionResult;
import graphql.language.Document;
import graphql.language.Field;
import graphql.language.OperationDefinition;
import graphql.language.Selection;
import graphql.language.SelectionSet;
import graphql.language.StringValue;
import graphql.parser.Parser;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.graphql.ExecutionGraphQlService;
import org.springframework.graphql.support.DefaultExecutionGraphQlRequest;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
@Slf4j
public class GraphQlBuggyAssistantService {
  private static final int MAX_QUERY_ATTEMPTS = 2;
  private static final Pattern GRAPHQL_FENCE =
      Pattern.compile("```(?:graphql)?\\s*(.*?)```", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

  private static final String QUERY_RULES =
      """
      Create exactly one read-only GraphQL query that retrieves the minimum data needed to
      answer the user's question.

      Rules:
      - Use only fields and arguments present in the supplied schema.
      - Generate a query operation only. Never generate a mutation or subscription.
      - Include identifiers and human-readable fields needed to support the answer.
      - Return only the executable GraphQL document. Do not use Markdown or add an explanation.
      - Use the shortest relationship path that can answer the question.
      - An id argument accepts only a complete RDF IRI, such as a value beginning with urn: or
        https://. Use an id argument only when that exact IRI appears in the user's question.
      - Never guess an RDF IRI or convert a human-readable name into an id. For example, never use
        applicationOccurrence(id: "iceberg") when "iceberg" is only an application name.
      - When the user provides a name rather than an exact RDF IRI, query the corresponding plural
        collection field, include id and name, and retrieve the shortest nested data needed to
        answer the question. The final answer step will select the matching named entity.
      """;

  private static final String ANSWER_RULES =
      """
      Answer the user's question using only the supplied GraphQL result.

      Rules:
      - Do not use prior knowledge or invent missing facts.
      - If the result is empty, say that no matching data was found in the dependency graph.
      - If the result is insufficient, clearly say what cannot be determined.
      - Be concise, but include the application, package, vulnerability, and fixed-version details
        that directly answer the question when they are present.
      - Do not mention the query-generation process unless the GraphQL result contains errors.
      """;

  private final ChatModel chatModel;
  private final ExecutionGraphQlService graphQlService;
  private final ObjectMapper objectMapper;
  private final String schema;

  public GraphQlBuggyAssistantService(
      ChatModel chatModel,
      ExecutionGraphQlService graphQlService,
      ObjectMapper objectMapper,
      @Value("classpath:graphql/schema.graphqls") Resource schemaResource) {
    this.chatModel = chatModel;
    this.graphQlService = graphQlService;
    this.objectMapper = objectMapper;
    this.schema = readSchema(schemaResource);
  }

  public String ask(String question) {
    String normalizedQuestion = StringUtils.trimToNull(question);
    if (normalizedQuestion == null) {
      throw new IllegalArgumentException("Question must not be blank");
    }

    QueryExecution queryExecution = generateAndExecute(normalizedQuestion);
    return generateAnswer(normalizedQuestion, queryExecution);
  }

  private QueryExecution generateAndExecute(String question) {
    String previousQuery = null;
    List<Map<String, Object>> previousErrors = List.of();

    for (int attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt++) {
      String prompt = createQueryPrompt(question, previousQuery, previousErrors);
      String query = normalizeQuery(chatModel.chat(prompt));
      try {
        validateReadOnlyQuery(query, question);
      } catch (IllegalArgumentException exception) {
        if (attempt == MAX_QUERY_ATTEMPTS) {
          throw exception;
        }
        previousQuery = query;
        previousErrors = List.of(Map.of("message", exception.getMessage()));
        continue;
      }

      ExecutionResult result = execute(query);
      if (result.getErrors().isEmpty() || attempt == MAX_QUERY_ATTEMPTS) {
         return new QueryExecution(query, result.toSpecification());
      }

      previousQuery = query;
      previousErrors = result.getErrors().stream().map(error -> error.toSpecification()).toList();
      log.debug("Generated GraphQL query failed; asking the model to repair it: {}", previousErrors);
    }

    throw new IllegalStateException("Buggy could not generate a GraphQL query");
  }

  private String createQueryPrompt(
      String question, String previousQuery, List<Map<String, Object>> previousErrors) {
    StringBuilder prompt =
        new StringBuilder(QUERY_RULES)
            .append("\nGraphQL schema:\n")
            .append(schema)
            .append("\n\nUser question:\n")
            .append(question);

    if (previousQuery != null) {
      prompt
          .append("\n\nThe previous query was invalid:\n")
          .append(previousQuery)
          .append("\n\nGraphQL errors:\n")
          .append(writeJson(previousErrors))
          .append("\n\nRepair the query using the schema and return only the corrected query.");
    }

    return prompt.toString();
  }

  private ExecutionResult execute(String query) {
    var response =
        graphQlService
            .execute(
                new DefaultExecutionGraphQlRequest(
                    query,
                    null,
                    Map.of(),
                    Map.of(),
                    "buggy-" + UUID.randomUUID(),
                    Locale.ROOT))
            .block();

    if (response == null) {
      throw new IllegalStateException("GraphQL execution produced no response");
    }
    return response.getExecutionResult();
  }

  private String generateAnswer(String question, QueryExecution queryExecution) {
    String prompt =
        ANSWER_RULES
            + "\nUser question:\n"
            + question
            + "\n\nExecuted GraphQL query:\n"
            + queryExecution.query()
            + "\n\nGraphQL result:\n"
            + writeJson(queryExecution.result());

    String answer = StringUtils.trimToNull(chatModel.chat(prompt));
    if (answer == null) {
      throw new IllegalStateException("Buggy produced no final answer");
    }
    return answer;
  }

  private String normalizeQuery(String modelResponse) {
    String response = StringUtils.trimToNull(modelResponse);
    if (response == null) {
      throw new IllegalStateException("Buggy produced no GraphQL query");
    }

    Matcher fencedQuery = GRAPHQL_FENCE.matcher(response);
    return fencedQuery.find() ? fencedQuery.group(1).trim() : response;
  }

  private void validateReadOnlyQuery(String query, String question) {
    Document document;
    try {
      document = Parser.parse(query);
    } catch (RuntimeException exception) {
      throw new IllegalArgumentException("Buggy generated an invalid GraphQL document", exception);
    }

    List<OperationDefinition> operations = document.getDefinitionsOfType(OperationDefinition.class);
    if (operations.size() != 1
        || operations.getFirst().getOperation() != OperationDefinition.Operation.QUERY) {
      throw new IllegalArgumentException("Buggy must generate exactly one read-only GraphQL query");
    }

    validateIdArguments(operations.getFirst().getSelectionSet(), question);
  }

  private void validateIdArguments(SelectionSet selectionSet, String question) {
    if (selectionSet == null) {
      return;
    }
    for (Selection<?> selection : selectionSet.getSelections()) {
      if (!(selection instanceof Field field)) {
        continue;
      }
      field.getArguments().stream()
          .filter(argument -> argument.getName().equals("id"))
          .forEach(
              argument -> {
                if (!(argument.getValue() instanceof StringValue stringValue)) {
                  throw new IllegalArgumentException(
                      "Generated id arguments must contain a literal RDF IRI");
                }
                String id = stringValue.getValue();
                if (!isRdfIri(id) || !question.contains(id)) {
                  throw new IllegalArgumentException(
                      "The generated id '"
                          + id
                          + "' is not an exact RDF IRI supplied in the user's question; use the "
                          + "corresponding plural collection field and include id and name");
                }
              });
      validateIdArguments(field.getSelectionSet(), question);
    }
  }

  private boolean isRdfIri(String value) {
    return value.startsWith("urn:") || value.startsWith("http://") || value.startsWith("https://");
  }

  private String writeJson(Object value) {
    return objectMapper.writeValueAsString(value);
  }

  private String readSchema(Resource schemaResource) {
    try {
      String value = schemaResource.getContentAsString(StandardCharsets.UTF_8);
      if (value.isBlank()) {
        throw new IllegalStateException("GraphQL schema is empty");
      }
      return value;
    } catch (IOException exception) {
      throw new IllegalStateException("Could not load the GraphQL schema", exception);
    }
  }

  private record QueryExecution(String query, Map<String, Object> result) {
    private QueryExecution {
      Objects.requireNonNull(query);
      result = Map.copyOf(result);
    }
  }
}
