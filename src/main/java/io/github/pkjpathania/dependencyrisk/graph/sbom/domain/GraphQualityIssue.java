package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

public record GraphQualityIssue(
    IssueSeverity severity, GraphQualityStatus graphQuality, String message)
    implements ImportIssue {
  @Override
  public String code() {
    return "GRAPH_QUALITY";
  }
}
