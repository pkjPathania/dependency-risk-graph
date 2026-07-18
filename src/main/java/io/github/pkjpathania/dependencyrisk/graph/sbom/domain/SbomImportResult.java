package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

import java.util.List;

public record SbomImportResult(
    String importId,
    String activeImportId,
    String importRunIri,
    String rootOccurrenceIri,
    String productName,
    String productVersion,
    String specificationVersion,
    int componentCount,
    int dependencyEdgeCount,
    GraphQualityStatus graphQuality,
    List<ImportIssue> issues) {
  public SbomImportResult {
    issues = List.copyOf(issues);
  }
}
