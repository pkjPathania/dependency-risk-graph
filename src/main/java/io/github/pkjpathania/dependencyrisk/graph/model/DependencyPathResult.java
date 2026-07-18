package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record DependencyPathResult(
    DependencyPathStatus status,
    String importId,
    String rootOccurrenceIri,
    String targetPackageVersionIri,
    String matchedOccurrenceIri,
    List<DependencyPathNode> path,
    String message) {
  public DependencyPathResult {
    path = path == null ? List.of() : List.copyOf(path);
  }

  public static DependencyPathResult importNotFound(String importId, String targetPackageVersionIri) {
    return new DependencyPathResult(
        DependencyPathStatus.IMPORT_NOT_FOUND,
        importId,
        null,
        targetPackageVersionIri,
        null,
        List.of(),
        "Import not found");
  }
}
