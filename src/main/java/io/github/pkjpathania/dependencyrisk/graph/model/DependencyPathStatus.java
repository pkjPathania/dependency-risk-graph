package io.github.pkjpathania.dependencyrisk.graph.model;

public enum DependencyPathStatus {
  PATH_RESOLVED,
  IMPORT_NOT_FOUND,
  ROOT_OCCURRENCE_NOT_FOUND,
  TARGET_PACKAGE_NOT_FOUND_IN_IMPORT,
  TARGET_OCCURRENCE_UNREACHABLE,
  GRAPH_INCONSISTENT
}
