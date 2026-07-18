package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record CveImpactListItem(
    String vulnerabilityIri,
    String preferredIdentifier,
    String osvId,
    List<String> aliases,
    String summary,
    String severityLevel,
    int affectedApplicationCount,
    int affectedPackageVersionCount,
    int referenceCount,
    List<String> applicationNames,
    List<String> packageNames) {
  public CveImpactListItem {
    aliases = aliases == null ? List.of() : List.copyOf(aliases);
    applicationNames = applicationNames == null ? List.of() : List.copyOf(applicationNames);
    packageNames = packageNames == null ? List.of() : List.copyOf(packageNames);
  }
}
