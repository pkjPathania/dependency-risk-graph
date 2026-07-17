package io.github.pkjpathania.dependencyrisk.graph.model;

import java.time.Instant;

public record ApplicationOverview(
    long directDependencyCount,
    long transitiveDependencyCount,
    long uniquePackageCount,
    long graphNodeCount,
    long graphEdgeCount,
    Long vulnerablePackageCount,
    Long criticalVulnerabilityCount,
    Instant lastEnrichedAt) {

  public static ApplicationOverview empty() {
    return new ApplicationOverview(0L, 0L, 0L, 0L, 0L, null, null, null);
  }
}
