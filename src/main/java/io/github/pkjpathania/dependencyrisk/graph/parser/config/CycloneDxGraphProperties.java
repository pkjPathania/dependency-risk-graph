package io.github.pkjpathania.dependencyrisk.graph.parser.config;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dependency-risk.json-ld.cyclone-dx-context")
public record CycloneDxGraphProperties(Map<String, Object> context) {}
