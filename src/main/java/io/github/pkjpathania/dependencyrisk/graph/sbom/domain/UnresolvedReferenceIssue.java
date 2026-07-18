package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

public record UnresolvedReferenceIssue(
    IssueSeverity severity, String parentBomRef, String childBomRef, String message)
    implements ImportIssue {
  @Override
  public String code() {
    return "UNRESOLVED_BOM_REF";
  }
}
