package io.github.pkjpathania.dependencyrisk.workbench.evidence;

public record AdvisoryEvidenceMatch(
    String id,
    String vulnerabilityId,
    AdvisoryEvidenceSegmentType segmentType,
    double score,
    String text) {}
