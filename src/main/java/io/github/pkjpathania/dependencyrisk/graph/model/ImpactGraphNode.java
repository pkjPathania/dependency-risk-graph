package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.Map;

public record ImpactGraphNode(
    String id,
    String iri,
    String label,
    String version,
    String nodeType,
    Map<String, Object> metadata) {
  public ImpactGraphNode {
    metadata = metadata == null ? Map.of() : Map.copyOf(metadata);
  }
}
