package io.github.pkjpathania.dependencyrisk.workbench.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "dependency-risk.ai.assistant")
public record AssistantProperties(@NotBlank String systemPrompt) {}
