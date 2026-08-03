package io.github.pkjpathania.dependencyrisk.workbench.config;

import dev.langchain4j.model.TokenCountEstimator;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiTokenCountEstimator;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({BuggyModelProperties.class, BuggyOrchestrationProperties.class})
public class BuggyModelConfiguration {

  @Bean
  ChatModel buggyChatModel(BuggyModelProperties properties) {
    return OpenAiChatModel.builder()
        .baseUrl(properties.baseUrl())
        .apiKey(properties.apiKey())
        .modelName(properties.modelName())
        .temperature(properties.temperature())
        .timeout(properties.timeout())
        .logRequests(true)
        .logResponses(true)
        .build();
  }

  @Bean
  TokenCountEstimator buggyTokenCountEstimator(BuggyOrchestrationProperties properties) {
    return new OpenAiTokenCountEstimator(properties.tokenizerModelName());
  }
}
