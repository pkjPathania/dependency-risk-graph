package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

public record UnsupportedFieldIssue(IssueSeverity severity, String field, String message)
    implements ImportIssue {
  @Override
  public String code() {
    return "UNSUPPORTED_FIELD";
  }
}
