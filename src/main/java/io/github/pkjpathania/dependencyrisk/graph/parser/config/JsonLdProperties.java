package io.github.pkjpathania.dependencyrisk.graph.parser.config;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dependency-risk.json-ld")
public record JsonLdProperties(Map<String, Object> context) {}
