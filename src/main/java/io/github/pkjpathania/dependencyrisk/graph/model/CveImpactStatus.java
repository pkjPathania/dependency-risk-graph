package io.github.pkjpathania.dependencyrisk.graph.model;

public enum CveImpactStatus {
  AFFECTED_PATH_RESOLVED,
  AFFECTED_PATH_UNAVAILABLE,
  PACKAGE_NOT_PRESENT,
  IMPORT_NOT_FOUND,
  VULNERABILITY_NOT_LINKED,
  INDETERMINATE
}
