package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record CveImpactDetailResponse(
    VulnerabilityDetail vulnerability,
    List<ExposurePath> exposures,
    List<FixedVersionView> fixedVersions,
    List<CvssAssessmentView> cvssAssessments,
    List<String> referenceUrls,
    ImpactGraph graph) {
  public CveImpactDetailResponse {
    exposures = exposures == null ? List.of() : List.copyOf(exposures);
    fixedVersions = fixedVersions == null ? List.of() : List.copyOf(fixedVersions);
    cvssAssessments = cvssAssessments == null ? List.of() : List.copyOf(cvssAssessments);
    referenceUrls = referenceUrls == null ? List.of() : List.copyOf(referenceUrls);
  }
}
