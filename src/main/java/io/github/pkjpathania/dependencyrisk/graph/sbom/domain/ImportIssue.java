package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

/** A structured, non-fatal issue discovered while importing an SBOM. */
public sealed interface ImportIssue
    permits ValidationIssue,
        DuplicateBomRefIssue,
        UnresolvedReferenceIssue,
        GraphQualityIssue,
        UnsupportedFieldIssue {
  IssueSeverity severity();

  String code();

  String message();
}
