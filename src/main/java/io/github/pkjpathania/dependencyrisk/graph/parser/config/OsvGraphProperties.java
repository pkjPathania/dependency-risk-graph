package io.github.pkjpathania.dependencyrisk.graph.parser.config;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dependency-risk.json-ld.osv-context")
public record OsvGraphProperties(Map<String, Object> context) {
  public OsvGraphProperties {
    context = context == null ? Map.of() : new LinkedHashMap<>(context);
  }
}
