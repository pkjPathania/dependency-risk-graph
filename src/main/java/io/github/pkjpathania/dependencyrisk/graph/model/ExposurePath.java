package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record ExposurePath(
    String exposureId,
    ApplicationView application,
    PackageVersionView vulnerablePackage,
    String dependencyType,
    int dependencyHops,
    String pathStatus,
    List<PathNodeView> path,
    List<String> pathNodeIds,
    List<String> pathEdgeIds) {
  public ExposurePath {
    path = path == null ? List.of() : List.copyOf(path);
    pathNodeIds = pathNodeIds == null ? List.of() : List.copyOf(pathNodeIds);
    pathEdgeIds = pathEdgeIds == null ? List.of() : List.copyOf(pathEdgeIds);
  }
}
