package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import java.util.List;
import java.util.Objects;

public record AdvisoryEvidenceSource(
    String vulnerabilityIri,
    String vulnerabilityId,
    List<String> aliases,
    String summary,
    String details,
    List<AffectedPackageEvidenceSource> affectedPackages) {

  public AdvisoryEvidenceSource {
    vulnerabilityIri = requireText(vulnerabilityIri, "vulnerabilityIri");
    vulnerabilityId = requireText(vulnerabilityId, "vulnerabilityId");
    aliases = normalizeAliases(aliases);
    summary = normalize(summary);
    details = normalize(details);
    affectedPackages = copyAffectedPackages(affectedPackages);
  }

  private static String requireText(String value, String fieldName) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(fieldName + " must not be blank");
    }

    return value.trim();
  }

  private static String normalize(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value.trim();
  }

  private static List<String> normalizeAliases(List<String> aliases) {
    if (aliases == null) {
      return List.of();
    }

    return aliases.stream()
        .filter(Objects::nonNull)
        .map(String::trim)
        .filter(alias -> !alias.isBlank())
        .distinct()
        .sorted()
        .toList();
  }

  private static List<AffectedPackageEvidenceSource> copyAffectedPackages(
      List<AffectedPackageEvidenceSource> affectedPackages) {
    if (affectedPackages == null) {
      return List.of();
    }

    affectedPackages.forEach(
        affectedPackage ->
            Objects.requireNonNull(
                affectedPackage, "affectedPackages must not contain null values"));
    return List.copyOf(affectedPackages);
  }
}
