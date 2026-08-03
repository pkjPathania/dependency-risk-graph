package io.github.pkjpathania.dependencyrisk.workbench.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("dependency-risk.ai.orchestration")
public record BuggyOrchestrationProperties(
    String tokenizerModelName,
    int maxInputTokens,
    int reservedOutputTokens,
    int chunkInputTokens,
    int chunkSummaryTokens) {

  public BuggyOrchestrationProperties {
    if (tokenizerModelName == null || tokenizerModelName.isBlank()) {
      throw new IllegalArgumentException("tokenizer-model-name must not be blank");
    }
    if (maxInputTokens <= 0) {
      throw new IllegalArgumentException("max-input-tokens must be greater than zero");
    }
    if (reservedOutputTokens < 0 || reservedOutputTokens >= maxInputTokens) {
      throw new IllegalArgumentException(
          "reserved-output-tokens must be non-negative and below max-input-tokens");
    }
    if (chunkInputTokens <= 0 || chunkInputTokens > maxInputTokens - reservedOutputTokens) {
      throw new IllegalArgumentException(
          "chunk-input-tokens must be positive and within the available input budget");
    }
    if (chunkSummaryTokens <= 0 || chunkSummaryTokens >= chunkInputTokens) {
      throw new IllegalArgumentException(
          "chunk-summary-tokens must be positive and below chunk-input-tokens");
    }
  }

  public int inputBudget() {
    return maxInputTokens - reservedOutputTokens;
  }
}
