package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record ImpactGraph(List<ImpactGraphNode> nodes, List<ImpactGraphEdge> edges) {
  public ImpactGraph {
    nodes = nodes == null ? List.of() : List.copyOf(nodes);
    edges = edges == null ? List.of() : List.copyOf(edges);
  }
}
