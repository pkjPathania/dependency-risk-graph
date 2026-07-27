package io.github.pkjpathania.dependencyrisk.workbench.config;

import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.model.chat.ChatModel;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.tools.DependencyRiskTools;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.GraphStateException;
import org.bsc.langgraph4j.agentexecutor.AgentExecutor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BuggyAiConfiguration {

  @Bean
  public CompiledGraph<AgentExecutor.State> dependencyRiskGraph(
      ChatModel chatModel, DependencyRiskTools dependencyRiskTools, AssistantProperties properties)
      throws GraphStateException {
    return AgentExecutor.builder()
        .chatModel(chatModel)
        .systemMessage(SystemMessage.from(properties.systemPrompt()))
        .toolsFromObject(dependencyRiskTools)
        .stateSerializer(AgentExecutor.Serializers.STD.object())
        .build()
        .compile();
  }
}
