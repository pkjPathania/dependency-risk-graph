package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record ImpactGraphEdge(
    String id, String source, String target, String relationship, List<String> exposureIds) {
  public ImpactGraphEdge {
    exposureIds = exposureIds == null ? List.of() : List.copyOf(exposureIds);
  }
}
