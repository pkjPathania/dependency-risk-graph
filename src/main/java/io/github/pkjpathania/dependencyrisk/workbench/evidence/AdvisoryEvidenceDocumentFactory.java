package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class AdvisoryEvidenceDocumentFactory {

  private static final String OVERVIEW_ID_SUFFIX = "::overview";

  private static final String DETAILS_ID_SUFFIX = "::details-and-remediation";

  public List<AdvisoryEvidenceDocument> create(AdvisoryEvidenceSource source) {

    Objects.requireNonNull(source, "Advisory evidence source must not be null");

    String vulnerabilityId = requireNonBlank(source.vulnerabilityId(), "Vulnerability ID");

    AdvisoryEvidenceDocument overview =
        new AdvisoryEvidenceDocument(
            vulnerabilityId + OVERVIEW_ID_SUFFIX,
            vulnerabilityId,
            AdvisoryEvidenceSegmentType.OVERVIEW,
            buildOverviewText(source));

    AdvisoryEvidenceDocument detailsAndRemediation =
        new AdvisoryEvidenceDocument(
            vulnerabilityId + DETAILS_ID_SUFFIX,
            vulnerabilityId,
            AdvisoryEvidenceSegmentType.DETAILS_AND_REMEDIATION,
            buildDetailsAndRemediationText(source));

    return List.of(overview, detailsAndRemediation);
  }

  private String buildOverviewText(AdvisoryEvidenceSource source) {

    StringBuilder text = new StringBuilder();

    appendLine(text, "Vulnerability: " + source.vulnerabilityId());

    appendAliases(text, source.aliases());

    if (StringUtils.isNotBlank(source.summary())) {
      appendBlankLine(text);
      appendLine(text, "Summary:");
      appendLine(text, source.summary().trim());
    }

    List<AffectedPackageEvidenceSource> packages = uniquePackagesByPurl(source.affectedPackages());

    if (!packages.isEmpty()) {
      appendBlankLine(text);
      appendLine(text, "Affected packages:");

      for (AffectedPackageEvidenceSource affectedPackage : packages) {

        appendLine(text, "- " + packageDescription(affectedPackage));
      }
    }

    return text.toString().trim();
  }

  private String buildDetailsAndRemediationText(AdvisoryEvidenceSource source) {

    StringBuilder text = new StringBuilder();

    appendLine(text, "Vulnerability: " + source.vulnerabilityId());

    appendAliases(text, source.aliases());

    if (StringUtils.isNotBlank(source.summary())) {
      appendBlankLine(text);
      appendLine(text, "Summary:");
      appendLine(text, source.summary().trim());
    }

    if (StringUtils.isNotBlank(source.details())) {
      appendBlankLine(text);
      appendLine(text, "Technical details and remediation evidence:");

      appendLine(text, source.details().trim());
    }

    Set<String> sourceUrls = uniqueSourceUrls(source.affectedPackages());

    if (!sourceUrls.isEmpty()) {
      appendBlankLine(text);
      appendLine(text, "Advisory sources:");

      for (String sourceUrl : sourceUrls) {
        appendLine(text, "- " + sourceUrl);
      }
    }

    return text.toString().trim();
  }

  /**
   * The RDF source preserves every affected-package resource because separate resources may
   * represent separate affected version ranges.
   *
   * <p>Embedded overview text only needs each semantic package identity once, so deduplication
   * happens here by package PURL.
   */
  private List<AffectedPackageEvidenceSource> uniquePackagesByPurl(
      List<AffectedPackageEvidenceSource> affectedPackages) {

    if (affectedPackages == null || affectedPackages.isEmpty()) {
      return List.of();
    }

    Map<String, AffectedPackageEvidenceSource> packagesByIdentity = new LinkedHashMap<>();

    for (AffectedPackageEvidenceSource affectedPackage : affectedPackages) {

      if (affectedPackage == null) {
        continue;
      }

      String identity =
          firstNonBlank(affectedPackage.purl(), affectedPackage.name(), affectedPackage.iri());

      if (identity == null) {
        continue;
      }

      packagesByIdentity.putIfAbsent(identity, affectedPackage);
    }

    return List.copyOf(packagesByIdentity.values());
  }

  private Set<String> uniqueSourceUrls(List<AffectedPackageEvidenceSource> affectedPackages) {

    Set<String> sourceUrls = new LinkedHashSet<>();

    if (affectedPackages == null) {
      return sourceUrls;
    }

    for (AffectedPackageEvidenceSource affectedPackage : affectedPackages) {

      if (affectedPackage == null) {
        continue;
      }

      String sourceUrl = StringUtils.trimToNull(affectedPackage.sourceUrl());

      if (sourceUrl != null) {
        sourceUrls.add(sourceUrl);
      }
    }

    return sourceUrls;
  }

  private String packageDescription(AffectedPackageEvidenceSource affectedPackage) {

    String name = StringUtils.trimToNull(affectedPackage.name());

    String purl = StringUtils.trimToNull(affectedPackage.purl());

    String ecosystem = StringUtils.trimToNull(affectedPackage.ecosystem());

    StringBuilder description = new StringBuilder();

    if (name != null) {
      description.append(name);
    } else if (purl != null) {
      description.append(purl);
    } else {
      description.append(affectedPackage.iri());
    }

    if (purl != null && !purl.equals(name)) {
      description.append(" [").append(purl).append(']');
    }

    if (ecosystem != null) {
      description.append(" (").append(ecosystem).append(')');
    }

    return description.toString();
  }

  private void appendAliases(StringBuilder text, List<String> aliases) {

    if (aliases == null || aliases.isEmpty()) {
      return;
    }

    List<String> normalizedAliases =
        aliases.stream()
            .map(StringUtils::trimToNull)
            .filter(Objects::nonNull)
            .distinct()
            .sorted()
            .toList();

    if (!normalizedAliases.isEmpty()) {
      appendLine(text, "Aliases: " + String.join(", ", normalizedAliases));
    }
  }

  private String firstNonBlank(String... values) {

    for (String value : values) {
      String normalized = StringUtils.trimToNull(value);

      if (normalized != null) {
        return normalized;
      }
    }

    return null;
  }

  private String requireNonBlank(String value, String fieldName) {

    String normalized = StringUtils.trimToNull(value);

    if (normalized == null) {
      throw new IllegalArgumentException(fieldName + " must not be blank");
    }

    return normalized;
  }

  private void appendBlankLine(StringBuilder text) {

    if (!text.isEmpty() && text.charAt(text.length() - 1) != '\n') {
      text.append('\n');
    }

    text.append('\n');
  }

  private void appendLine(StringBuilder text, String value) {

    text.append(value).append('\n');
  }
}
