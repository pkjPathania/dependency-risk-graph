package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class AdvisoryDetailsSectionParser {

  private static final Pattern HEADING_PATTERN =
      Pattern.compile("(?m)^##\\s+(.+?)\\s*$");

  public Map<AdvisoryEvidenceSegmentType, String> parse(String details) {

    String normalizedDetails = StringUtils.trimToNull(details);

    if (normalizedDetails == null) {
      return Map.of();
    }

    Matcher matcher = HEADING_PATTERN.matcher(normalizedDetails);

    List<HeadingPosition> headings = new ArrayList<>();

    while (matcher.find()) {
      headings.add(
          new HeadingPosition(
              matcher.group(1).trim(),
              matcher.start(),
              matcher.end()));
    }

    if (headings.isEmpty()) {
      return Map.of(
          AdvisoryEvidenceSegmentType.TECHNICAL_DETAILS,
          normalizedDetails);
    }

    Map<AdvisoryEvidenceSegmentType, String> sections =
        new EnumMap<>(AdvisoryEvidenceSegmentType.class);

    for (int index = 0; index < headings.size(); index++) {
      HeadingPosition current = headings.get(index);

      int contentEnd =
          index + 1 < headings.size()
              ? headings.get(index + 1).headingStart()
              : normalizedDetails.length();

      String body =
          StringUtils.trimToNull(
              normalizedDetails.substring(
                  current.contentStart(),
                  contentEnd));

      if (body == null) {
        continue;
      }

      AdvisoryEvidenceSegmentType segmentType =
          mapHeading(current.heading());

      sections.merge(
          segmentType,
          body,
          (existing, additional) ->
              existing + "\n\n" + additional);
    }

    return Map.copyOf(sections);
  }

  private AdvisoryEvidenceSegmentType mapHeading(String heading) {

    String normalized =
        heading.toLowerCase(Locale.ROOT);

    if (normalized.contains("impact")) {
      return AdvisoryEvidenceSegmentType.IMPACT;
    }

    if (normalized.contains("affected")
        || normalized.contains("patched")
        || normalized.contains("remediation")) {
      return AdvisoryEvidenceSegmentType.REMEDIATION;
    }

    if (normalized.contains("severity")
        || normalized.contains("cwe")) {
      return AdvisoryEvidenceSegmentType.SEVERITY;
    }

    if (normalized.contains("upstream")
        || normalized.equals("fix")
        || normalized.startsWith("fix ")) {
      return AdvisoryEvidenceSegmentType.UPSTREAM_FIX;
    }

    return AdvisoryEvidenceSegmentType.TECHNICAL_DETAILS;
  }

  private record HeadingPosition(
      String heading,
      int headingStart,
      int contentStart) {}
}