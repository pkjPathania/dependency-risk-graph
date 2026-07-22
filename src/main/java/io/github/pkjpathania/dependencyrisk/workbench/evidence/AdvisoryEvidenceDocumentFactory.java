package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdvisoryEvidenceDocumentFactory {

  private final AdvisoryDetailsSectionParser sectionParser;

  public List<AdvisoryEvidenceDocument> create(AdvisoryEvidenceSource source) {

    if (source == null) {
      throw new IllegalArgumentException("Advisory evidence source must not be null");
    }

    String vulnerabilityId = StringUtils.trimToNull(source.vulnerabilityId());

    if (vulnerabilityId == null) {
      throw new IllegalArgumentException("Advisory evidence source is missing vulnerability ID");
    }

    List<AdvisoryEvidenceDocument> documents = new ArrayList<>();

    documents.add(createOverview(source));

    Map<AdvisoryEvidenceSegmentType, String> sections = sectionParser.parse(source.details());

    for (Map.Entry<AdvisoryEvidenceSegmentType, String> section : sections.entrySet()) {

      documents.add(createSection(source, section.getKey(), section.getValue()));
    }

    return List.copyOf(documents);
  }

  private AdvisoryEvidenceDocument createOverview(AdvisoryEvidenceSource source) {

    String affectedPackages =
        source.affectedPackages() == null
            ? ""
            : source.affectedPackages().stream()
                .map(this::formatAffectedPackage)
                .filter(StringUtils::isNotBlank)
                .distinct()
                .collect(Collectors.joining("\n"));

    if (affectedPackages.isBlank()) {
      affectedPackages = "- No affected package metadata available";
    }

    String text =
        """
        Vulnerability: %s
        Aliases: %s

        Summary:
        %s

        Affected packages:
        %s
        """
            .formatted(
                source.vulnerabilityId(),
                formatAliases(source.aliases()),
                StringUtils.defaultIfBlank(source.summary(), "No summary available"),
                affectedPackages)
            .trim();

    return createDocument(source, AdvisoryEvidenceSegmentType.OVERVIEW, text);
  }

  private AdvisoryEvidenceDocument createSection(
      AdvisoryEvidenceSource source, AdvisoryEvidenceSegmentType segmentType, String body) {

    String text =
        """
        Vulnerability: %s
        Aliases: %s

        Section: %s

        %s
        """
            .formatted(
                source.vulnerabilityId(),
                formatAliases(source.aliases()),
                displayName(segmentType),
                StringUtils.defaultString(body))
            .trim();

    return createDocument(source, segmentType, text);
  }

  private AdvisoryEvidenceDocument createDocument(
      AdvisoryEvidenceSource source, AdvisoryEvidenceSegmentType segmentType, String text) {

    String id =
        source.vulnerabilityId()
            + "::"
            + segmentType.name().toLowerCase(Locale.ROOT).replace('_', '-');

    return new AdvisoryEvidenceDocument(id, source.vulnerabilityId(), segmentType, text);
  }

  private String formatAliases(List<String> aliases) {

    if (aliases == null || aliases.isEmpty()) {
      return "None";
    }

    String value =
        aliases.stream()
            .map(StringUtils::trimToNull)
            .filter(alias -> alias != null)
            .distinct()
            .sorted()
            .collect(Collectors.joining(", "));

    return StringUtils.defaultIfBlank(value, "None");
  }

  private String formatAffectedPackage(AffectedPackageEvidenceSource source) {

    if (source == null) {
      return null;
    }

    String name = StringUtils.defaultIfBlank(source.name(), "Unknown package");

    StringBuilder result = new StringBuilder("- ").append(name);

    if (StringUtils.isNotBlank(source.purl())) {
      result.append(" [").append(source.purl()).append(']');
    }

    if (StringUtils.isNotBlank(source.ecosystem())) {
      result.append(" (").append(source.ecosystem()).append(')');
    }

    return result.toString();
  }

  private String displayName(AdvisoryEvidenceSegmentType type) {

    return switch (type) {
      case OVERVIEW -> "Overview";
      case TECHNICAL_DETAILS -> "Technical details";
      case IMPACT -> "Impact";
      case REMEDIATION -> "Remediation and patched versions";
      case SEVERITY -> "Severity and CWE";
      case UPSTREAM_FIX -> "Upstream fix";
    };
  }
}
