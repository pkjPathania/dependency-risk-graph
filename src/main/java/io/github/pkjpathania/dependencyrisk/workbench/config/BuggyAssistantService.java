package io.github.pkjpathania.dependencyrisk.workbench.config;

import dev.langchain4j.data.message.UserMessage;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.bsc.async.AsyncGenerator;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.NodeOutput;
import org.bsc.langgraph4j.agentexecutor.AgentExecutor;
import org.bsc.langgraph4j.prebuilt.MessagesState;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BuggyAssistantService {
  private final CompiledGraph<AgentExecutor.State> dependencyRiskAssistantGraph;

  public String ask(String question) {
    question = StringUtils.trimToNull(question);
    if (Objects.isNull(question)) throw new IllegalArgumentException("Question cannot be blank");
    Map<String, Object> inputs = createInputs(question);
    AgentExecutor.State finalState =
        dependencyRiskAssistantGraph
            .invoke(inputs)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "The dependency-risk assistant graph produced no final state"));

    return finalState
        .finalResponse()
        .filter(response -> !response.isBlank())
        .orElseThrow(
            () ->
                new IllegalStateException(
                    "The dependency-risk assistant graph produced no final response"));
  }

  private Map<String, Object> createInputs(String question) {
    String normalizedQuestion = StringUtils.trimToNull(question);
    if (Objects.isNull(normalizedQuestion))
      throw new IllegalArgumentException("Question must not be blank");

    UserMessage userMessage = UserMessage.from(normalizedQuestion);
    return Map.of(MessagesState.MESSAGES_STATE, List.of(userMessage));
  }

  private AsyncGenerator<NodeOutput<AgentExecutor.State>> stream(String question) {
    Map<String, Object> input = createInputs(question);
    return dependencyRiskAssistantGraph.stream(input);
  }
}
