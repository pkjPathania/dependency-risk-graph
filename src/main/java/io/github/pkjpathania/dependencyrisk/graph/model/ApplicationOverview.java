package io.github.pkjpathania.dependencyrisk.graph.model;

import java.time.Instant;

public record ApplicationOverview(
    long directDependencyCount,
    long transitiveDependencyCount,
    long uniquePackageCount,
    long graphNodeCount,
    long graphEdgeCount,
    long vulnerablePackages,
    long criticalVulnerabilities,
    Instant lastEnrichedAt) {

  public static ApplicationOverview empty() {
    return new ApplicationOverview(0L, 0L, 0L, 0L, 0L, 0L, 0L, null);
  }
}
