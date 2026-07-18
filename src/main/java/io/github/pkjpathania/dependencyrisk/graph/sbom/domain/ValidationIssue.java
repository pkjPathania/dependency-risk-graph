package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

public record ValidationIssue(IssueSeverity severity, String message) implements ImportIssue {
  @Override
  public String code() {
    return "VALIDATION_WARNING";
  }
}
