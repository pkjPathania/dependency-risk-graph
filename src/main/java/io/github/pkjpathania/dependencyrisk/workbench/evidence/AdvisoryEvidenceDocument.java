package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import java.util.Objects;

public record AdvisoryEvidenceDocument(
    String id, String vulnerabilityId, AdvisoryEvidenceSegmentType segmentType, String text) {

  public AdvisoryEvidenceDocument {
    id = requireText(id, "id");
    vulnerabilityId = requireText(vulnerabilityId, "vulnerabilityId");
    segmentType = Objects.requireNonNull(segmentType, "segmentType must not be null");
    text = requireText(text, "text");
  }

  private static String requireText(String value, String fieldName) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(fieldName + " must not be blank");
    }

    return value.trim();
  }
}
