package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

import java.util.Objects;
import org.apache.jena.rdf.model.Model;

public record RdfMappingResult(
    Model model, SbomImportDiagnostics diagnostics, ImportedBomIdentity identity) {
  public RdfMappingResult {
    Objects.requireNonNull(model, "model");
    Objects.requireNonNull(diagnostics, "diagnostics");
    Objects.requireNonNull(identity, "identity");
  }
}
