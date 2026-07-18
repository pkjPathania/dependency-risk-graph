package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record AdvisoryReferenceItem(
    String vulnerabilityIri,
    String osvId,
    List<String> aliases,
    String summary,
    List<AffectedPackageReference> affectedPackages,
    List<String> referenceUrls) {

  public AdvisoryReferenceItem {
    aliases = aliases == null ? List.of() : List.copyOf(aliases);
    affectedPackages = affectedPackages == null ? List.of() : List.copyOf(affectedPackages);
    referenceUrls = referenceUrls == null ? List.of() : List.copyOf(referenceUrls);
  }
}
