package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

public record DuplicateBomRefIssue(
    IssueSeverity severity, String bomRef, String message) implements ImportIssue {
  @Override
  public String code() {
    return "DUPLICATE_BOM_REF";
  }
}
