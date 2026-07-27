package io.github.pkjpathania.dependencyrisk.workbench.assistant.states;

import java.util.Map;
import org.bsc.langgraph4j.state.AgentState;

public class DependencyRiskAssistantState extends AgentState {

  public static final String QUESTION = "question";
  public static final String MESSAGES = "messages";
  public static final String TOOL_CALLS = "toolCalls";
  public static final String TOOL_RESULTS = "toolResults";
  public static final String FINAL_ANSWER = "finalAnswer";
  public static final String ERROR = "error";

  public DependencyRiskAssistantState(Map<String, Object> initData) {
    super(initData);
  }

  public String question() {
    return value(QUESTION).map(String.class::cast).orElse("");
  }

  public String finalAnswer() {
    return value(FINAL_ANSWER).map(String.class::cast).orElse("");
  }
}
