package io.github.pkjpathania.dependencyrisk.workbench.assistant.service;

import dev.langchain4j.model.TokenCountEstimator;
import dev.langchain4j.model.chat.ChatModel;
import graphql.ExecutionResult;
import graphql.language.Document;
import graphql.language.Field;
import graphql.language.OperationDefinition;
import graphql.language.Selection;
import graphql.language.SelectionSet;
import graphql.language.StringValue;
import graphql.parser.Parser;
import io.github.pkjpathania.dependencyrisk.workbench.config.BuggyOrchestrationProperties;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletionException;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.GraphStateException;
import org.bsc.langgraph4j.StateGraph;
import org.bsc.langgraph4j.state.AgentState;
import org.bsc.langgraph4j.utils.EdgeMappings;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.graphql.ExecutionGraphQlService;
import org.springframework.graphql.support.DefaultExecutionGraphQlRequest;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
@Slf4j
public class GraphQlBuggyAssistantService {
  private static final String GENERATE_AND_EXECUTE = "generate_and_execute";
  private static final String PREPARE_ANSWER = "prepare_answer";
  private static final String ANSWER_DIRECTLY = "answer_directly";
  private static final String ANSWER_FROM_CHUNKS = "answer_from_chunks";
  private static final String DIRECT_ROUTE = "direct";
  private static final String CHUNKED_ROUTE = "chunked";
  private static final int MAX_QUERY_ATTEMPTS = 2;
  private static final Pattern GRAPHQL_FENCE =
      Pattern.compile("```(?:graphql)?\\s*(.*?)```", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

  private static final String QUERY_RULES =
      """
      You are a GraphQL query planner.

      Create exactly one minimal, read-only GraphQL query that retrieves the data
      required to answer the user's question.

      ROOT-SELECTION POLICY

      1. Identify the entity type the user wants returned.
      2. Select the root collection corresponding to that entity:
         - applications → applicationOccurrences
         - packages → packageOccurrences
         - vulnerabilities → vulnerabilities
      3. Do not select the root from an entity mentioned only as a condition.
      4. Prefer a direct field on the requested entity over a reverse traversal
         through another entity.
      5. Use the fewest relationship hops and selected fields possible.

      DOMAIN SEMANTICS

      - ApplicationOccurrence.vulnerabilities contains vulnerabilities affecting
        packages used directly or transitively by the application.
      - PackageOccurrence.vulnerabilities contains vulnerabilities affecting that
        specific package occurrence.
      - PackageOccurrence.applications contains applications using that specific
        package occurrence.
      - Vulnerability.applications contains applications impacted by the
        vulnerability.
      - Vulnerability.packages contains package occurrences affected by the
        vulnerability.

      APPLICATION-VULNERABILITY RULE

      Questions including any of the following meanings must start from
      applicationOccurrences:

      - Which applications are vulnerable?
      - Which applications are affected?
      - Which applications use a vulnerable package?
      - List applications with vulnerabilities.
      - Show impacted applications.

      For those questions, generate exactly this shape unless additional fields are
      explicitly requested:

      query ApplicationOccurrences {
        applicationOccurrences {
          id
          vulnerabilities {
            id
          }
        }
      }

      Never use packageOccurrences → vulnerabilities → applications for this intent.

      FIELD-SELECTION RULES

      - Always include id.
      - Include name only when explicitly requested.
      - Do not retrieve summaries, details, aliases, versions, packages or other
        fields unless necessary for the question.
      - Generate a query operation only.
      - Never generate a mutation or subscription.
      - Return only the executable GraphQL document.
      - Do not use Markdown fences.
      - Do not include an explanation.

      ID RULES

      - Use a singular field with an id argument only when the exact complete RDF IRI
        appears in the user's question.
      - Never manufacture or infer an RDF IRI from a human-readable name.
      - When no exact IRI is supplied, use the appropriate plural collection.

      GraphQL schema:

      {{schema}}
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

  private static final String EVIDENCE_RULES =
      """
      Extract only facts from this GraphQL-result fragment that help answer the user's question.
      Return compact JSON Lines (JSONL), with one self-contained fact per line. Preserve exact IDs,
      names, versions, vulnerability IDs, and fixed versions. Return an empty response when the
      fragment contains no relevant facts. Do not answer the question and do not add prose.
      """;

  private static final String REDUCE_RULES =
      """
      Merge and deduplicate the supplied evidence. Return compact JSON Lines (JSONL), with one
      self-contained fact per line. Keep only facts needed for the user's question and preserve
      exact IDs, names, versions, vulnerability IDs, and fixed versions. Do not answer the question.
      """;

  private final ChatModel chatModel;
  private final ExecutionGraphQlService graphQlService;
  private final ObjectMapper objectMapper;
  private final TokenCountEstimator tokenCountEstimator;
  private final BuggyOrchestrationProperties orchestrationProperties;
  private final String schema;
  private final CompiledGraph<BuggyWorkflowState> workflow;

  public GraphQlBuggyAssistantService(
      ChatModel chatModel,
      ExecutionGraphQlService graphQlService,
      ObjectMapper objectMapper,
      TokenCountEstimator tokenCountEstimator,
      BuggyOrchestrationProperties orchestrationProperties,
      @Value("classpath:graphql/schema.graphqls") Resource schemaResource) {
    this.chatModel = chatModel;
    this.graphQlService = graphQlService;
    this.objectMapper = objectMapper;
    this.tokenCountEstimator = tokenCountEstimator;
    this.orchestrationProperties = orchestrationProperties;
    this.schema = readSchema(schemaResource);
    this.workflow = compileWorkflow();
  }

  public String ask(String question) {
    String normalizedQuestion = StringUtils.trimToNull(question);
    if (normalizedQuestion == null) {
      throw new IllegalArgumentException("Question must not be blank");
    }

    try {
      BuggyWorkflowState finalState =
          workflow
              .invoke(Map.of(BuggyWorkflowState.QUESTION, normalizedQuestion))
              .orElseThrow(
                  () -> new IllegalStateException("Buggy workflow produced no final state"));
      return finalState.finalAnswer();
    } catch (CompletionException exception) {
      throw unwrapWorkflowException(exception);
    }
  }

  private RuntimeException unwrapWorkflowException(CompletionException exception) {
    Throwable cause = exception;
    while (cause.getCause() != null) {
      cause = cause.getCause();
    }
    return cause instanceof RuntimeException runtimeException ? runtimeException : exception;
  }

  private CompiledGraph<BuggyWorkflowState> compileWorkflow() {
    try {
      StateGraph<BuggyWorkflowState> graph = new StateGraph<>(BuggyWorkflowState::new);
      graph
          .addNode(
              GENERATE_AND_EXECUTE,
              org.bsc.langgraph4j.action.AsyncNodeAction.node_async(
                  state ->
                      Map.of(
                          BuggyWorkflowState.QUERY_EXECUTION,
                          generateAndExecute(state.question()))))
          .addNode(
              PREPARE_ANSWER,
              org.bsc.langgraph4j.action.AsyncNodeAction.node_async(this::prepareAnswer))
          .addNode(
              ANSWER_DIRECTLY,
              org.bsc.langgraph4j.action.AsyncNodeAction.node_async(this::answerDirectly))
          .addNode(
              ANSWER_FROM_CHUNKS,
              org.bsc.langgraph4j.action.AsyncNodeAction.node_async(this::answerFromChunks))
          .addEdge(StateGraph.START, GENERATE_AND_EXECUTE)
          .addEdge(GENERATE_AND_EXECUTE, PREPARE_ANSWER)
          .addConditionalEdges(
              PREPARE_ANSWER,
              org.bsc.langgraph4j.action.AsyncEdgeAction.edge_async(this::answerRoute),
              EdgeMappings.builder()
                  .to(ANSWER_DIRECTLY, DIRECT_ROUTE)
                  .to(ANSWER_FROM_CHUNKS, CHUNKED_ROUTE)
                  .build())
          .addEdge(ANSWER_DIRECTLY, StateGraph.END)
          .addEdge(ANSWER_FROM_CHUNKS, StateGraph.END);
      return graph.compile();
    } catch (GraphStateException exception) {
      throw new IllegalStateException("Could not compile the Buggy orchestration graph", exception);
    }
  }

  private Map<String, Object> prepareAnswer(BuggyWorkflowState state) {
    String prompt = createAnswerPrompt(state.question(), state.queryExecution());
    return Map.of(
        BuggyWorkflowState.ANSWER_PROMPT,
        prompt,
        BuggyWorkflowState.ANSWER_PROMPT_TOKENS,
        estimateTokens(prompt));
  }

  private String answerRoute(BuggyWorkflowState state) {
    int tokenCount = state.answerPromptTokens();
    if (tokenCount <= orchestrationProperties.inputBudget()) {
      log.debug("Routing Buggy answer prompt directly ({} tokens)", tokenCount);
      return DIRECT_ROUTE;
    }
    log.info(
        "Routing oversized Buggy answer prompt through JSONL chunks ({} tokens, {} token budget)",
        tokenCount,
        orchestrationProperties.inputBudget());
    return CHUNKED_ROUTE;
  }

  private Map<String, Object> answerDirectly(BuggyWorkflowState state) {
    return Map.of(
        BuggyWorkflowState.FINAL_ANSWER,
        requireAnswer(chatWithinBudget(state.answerPrompt(), "final answer")));
  }

  private Map<String, Object> answerFromChunks(BuggyWorkflowState state) {
    QueryExecution queryExecution = state.queryExecution();
    String result = writeJson(queryExecution.result());
    List<String> fragments =
        splitToTokenBudget(
            result,
            fragment -> createEvidencePrompt(state.question(), queryExecution.query(), fragment),
            orchestrationProperties.chunkInputTokens());

    List<String> evidence = new ArrayList<>(fragments.size());
    for (int index = 0; index < fragments.size(); index++) {
      String prompt =
          createEvidencePrompt(state.question(), queryExecution.query(), fragments.get(index));
      String summary =
          chatWithinBudget(prompt, "evidence fragment " + (index + 1) + " of " + fragments.size());
      String compactSummary =
          truncateToTokenLimit(summary, orchestrationProperties.chunkSummaryTokens());
      if (StringUtils.isNotBlank(compactSummary)) {
        evidence.add(compactSummary);
      }
    }

    evidence = reduceEvidenceToFit(state.question(), queryExecution.query(), evidence);
    String finalPrompt =
        createChunkedAnswerPrompt(state.question(), queryExecution.query(), evidence);
    return Map.of(
        BuggyWorkflowState.FINAL_ANSWER,
        requireAnswer(chatWithinBudget(finalPrompt, "chunked final answer")));
  }

  private QueryExecution generateAndExecute(String question) {
    String previousQuery = null;
    List<Map<String, Object>> previousErrors = List.of();

    for (int attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt++) {
      String prompt = createQueryPrompt(question, previousQuery, previousErrors);
      String query = normalizeQuery(chatWithinBudget(prompt, "GraphQL query generation"));
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
      log.debug(
          "Generated GraphQL query failed; asking the model to repair it: {}", previousErrors);
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
                    query, null, Map.of(), Map.of(), "buggy-" + UUID.randomUUID(), Locale.ROOT))
            .block();

    if (response == null) {
      throw new IllegalStateException("GraphQL execution produced no response");
    }
    return response.getExecutionResult();
  }

  private String createAnswerPrompt(String question, QueryExecution queryExecution) {
    return ANSWER_RULES
        + "\nUser question:\n"
        + question
        + "\n\nExecuted GraphQL query:\n"
        + queryExecution.query()
        + "\n\nGraphQL result:\n"
        + writeJson(queryExecution.result());
  }

  private String createEvidencePrompt(String question, String query, String fragment) {
    return EVIDENCE_RULES
        + "\nUser question:\n"
        + question
        + "\n\nExecuted GraphQL query:\n"
        + query
        + "\n\nGraphQL-result fragment:\n"
        + fragment;
  }

  private String createChunkedAnswerPrompt(String question, String query, List<String> evidence) {
    return ANSWER_RULES
        + "\nThe complete GraphQL result exceeded the model context window, so it was processed "
        + "in fragments. The compact JSONL evidence below was extracted from those fragments.\n"
        + "\nUser question:\n"
        + question
        + "\n\nExecuted GraphQL query:\n"
        + query
        + "\n\nExtracted GraphQL evidence (JSONL):\n"
        + String.join("\n", evidence);
  }

  private String createReductionPrompt(String question, List<String> evidence) {
    return REDUCE_RULES
        + "\nUser question:\n"
        + question
        + "\n\nEvidence to merge (JSONL):\n"
        + String.join("\n", evidence);
  }

  private List<String> reduceEvidenceToFit(
      String question, String query, List<String> initialEvidence) {
    List<String> evidence = List.copyOf(initialEvidence);
    while (estimateTokens(createChunkedAnswerPrompt(question, query, evidence))
        > orchestrationProperties.inputBudget()) {
      List<List<String>> batches = partitionEvidence(question, evidence);
      if (batches.size() >= evidence.size()) {
        String joinedEvidence = String.join("\n", evidence);
        return List.of(truncateEvidenceToFinalPromptBudget(question, query, joinedEvidence));
      }

      List<String> reduced = new ArrayList<>(batches.size());
      for (int index = 0; index < batches.size(); index++) {
        String prompt = createReductionPrompt(question, batches.get(index));
        String summary =
            chatWithinBudget(prompt, "evidence reduction " + (index + 1) + " of " + batches.size());
        String compactSummary =
            truncateToTokenLimit(summary, orchestrationProperties.chunkSummaryTokens());
        if (StringUtils.isNotBlank(compactSummary)) {
          reduced.add(compactSummary);
        }
      }
      evidence = List.copyOf(reduced);
    }
    return evidence;
  }

  private String truncateEvidenceToFinalPromptBudget(
      String question, String query, String evidence) {
    int low = 0;
    int high = evidence.length();
    int bestEnd = 0;
    while (low <= high) {
      int middle = low + (high - low) / 2;
      int end = safeEnd(evidence, middle);
      String candidate = evidence.substring(0, end);
      if (estimateTokens(createChunkedAnswerPrompt(question, query, List.of(candidate)))
          <= orchestrationProperties.inputBudget()) {
        bestEnd = end;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return evidence.substring(0, bestEnd);
  }

  private List<List<String>> partitionEvidence(String question, List<String> evidence) {
    List<List<String>> batches = new ArrayList<>();
    List<String> batch = new ArrayList<>();
    for (String item : evidence) {
      List<String> candidate = new ArrayList<>(batch);
      candidate.add(item);
      if (!batch.isEmpty()
          && estimateTokens(createReductionPrompt(question, candidate))
              > orchestrationProperties.chunkInputTokens()) {
        batches.add(List.copyOf(batch));
        batch.clear();
      }
      batch.add(item);
    }
    if (!batch.isEmpty()) {
      batches.add(List.copyOf(batch));
    }
    return batches;
  }

  private List<String> splitToTokenBudget(
      String text, Function<String, String> promptFactory, int tokenBudget) {
    if (estimateTokens(promptFactory.apply("")) > tokenBudget) {
      throw new IllegalStateException(
          "Buggy's question and instructions exceed the configured chunk token budget");
    }

    List<String> fragments = new ArrayList<>();
    int offset = 0;
    while (offset < text.length()) {
      int low = offset + 1;
      int high = text.length();
      int bestEnd = -1;
      while (low <= high) {
        int middle = low + (high - low) / 2;
        String candidate = text.substring(offset, safeEnd(text, middle));
        if (estimateTokens(promptFactory.apply(candidate)) <= tokenBudget) {
          bestEnd = safeEnd(text, middle);
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }
      if (bestEnd <= offset) {
        throw new IllegalStateException(
            "Could not split the GraphQL result within the token budget");
      }

      int delimiter = text.lastIndexOf("},", bestEnd - 1);
      if (delimiter > offset + ((bestEnd - offset) * 3 / 4)) {
        bestEnd = delimiter + 2;
      }
      fragments.add(text.substring(offset, bestEnd));
      offset = bestEnd;
    }
    return fragments;
  }

  private String chatWithinBudget(String prompt, String stage) {
    int tokenCount = estimateTokens(prompt);
    if (tokenCount > orchestrationProperties.inputBudget()) {
      throw new IllegalStateException(
          "Buggy's "
              + stage
              + " prompt requires "
              + tokenCount
              + " tokens, above the configured input budget of "
              + orchestrationProperties.inputBudget());
    }
    log.debug("Sending Buggy {} prompt to the chat model ({} tokens)", stage, tokenCount);
    return chatModel.chat(prompt);
  }

  private String requireAnswer(String modelResponse) {
    String answer = StringUtils.trimToNull(modelResponse);
    if (answer == null) {
      throw new IllegalStateException("Buggy produced no final answer");
    }
    return answer;
  }

  private String truncateToTokenLimit(String value, int tokenLimit) {
    if (estimateTokens(value) <= tokenLimit) {
      return value;
    }
    int low = 0;
    int high = value.length();
    int bestEnd = 0;
    while (low <= high) {
      int middle = low + (high - low) / 2;
      int end = safeEnd(value, middle);
      if (estimateTokens(value.substring(0, end)) <= tokenLimit) {
        bestEnd = end;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return value.substring(0, bestEnd);
  }

  private int safeEnd(String value, int end) {
    if (end > 0 && end < value.length() && Character.isHighSurrogate(value.charAt(end - 1))) {
      return end - 1;
    }
    return end;
  }

  private int estimateTokens(String text) {
    return tokenCountEstimator.estimateTokenCountInText(text);
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

  private static final class BuggyWorkflowState extends AgentState {
    private static final String QUESTION = "question";
    private static final String QUERY_EXECUTION = "queryExecution";
    private static final String ANSWER_PROMPT = "answerPrompt";
    private static final String ANSWER_PROMPT_TOKENS = "answerPromptTokens";
    private static final String FINAL_ANSWER = "finalAnswer";

    private BuggyWorkflowState(Map<String, Object> initData) {
      super(initData);
    }

    private String question() {
      return value(QUESTION).map(String.class::cast).orElseThrow();
    }

    private QueryExecution queryExecution() {
      return value(QUERY_EXECUTION).map(QueryExecution.class::cast).orElseThrow();
    }

    private String answerPrompt() {
      return value(ANSWER_PROMPT).map(String.class::cast).orElseThrow();
    }

    private int answerPromptTokens() {
      return value(ANSWER_PROMPT_TOKENS).map(Integer.class::cast).orElseThrow();
    }

    private String finalAnswer() {
      return value(FINAL_ANSWER).map(String.class::cast).orElseThrow();
    }
  }

  private record QueryExecution(String query, Map<String, Object> result)
      implements java.io.Serializable {
    private QueryExecution {
      Objects.requireNonNull(query);
      result = Map.copyOf(result);
    }
  }
}
