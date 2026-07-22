package io.github.pkjpathania.dependencyrisk.workbench.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("dependency-risk.ai.model")
public record BuggyModelProperties(
    String provider,
    String baseUrl,
    String modelName,
    String apiKey,
    double temperature,
    Duration timeout) {}
