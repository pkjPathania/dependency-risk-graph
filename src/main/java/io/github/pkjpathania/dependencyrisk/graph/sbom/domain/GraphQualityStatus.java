package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

public enum GraphQualityStatus {
  USABLE_DEPENDENCY_GRAPH,
  MODULE_ONLY_GRAPH,
  ROOT_ONLY_GRAPH,
  NO_DEPENDENCY_GRAPH,
  GRAPH_WITH_UNRESOLVED_REFERENCES,
  GRAPH_COMPLETENESS_UNSPECIFIED
}
