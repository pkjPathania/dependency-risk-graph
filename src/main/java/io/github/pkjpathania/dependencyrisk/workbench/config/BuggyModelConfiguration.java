package io.github.pkjpathania.dependencyrisk.workbench.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(BuggyModelProperties.class)
public class BuggyModelConfiguration {

  @Bean
  ChatModel buggyChatModel(BuggyModelProperties properties) {
    return OpenAiChatModel.builder()
        .baseUrl(properties.baseUrl())
        .apiKey(properties.apiKey())
        .modelName(properties.modelName())
        .temperature(properties.temperature())
        .timeout(properties.timeout())
        .build();
  }
}
