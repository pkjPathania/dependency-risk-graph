package io.github.pkjpathania.dependencyrisk.graph.sbom.application;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportCommand;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportResult;

/** Input boundary for validating, mapping, and atomically persisting a CycloneDX SBOM. */
public interface ImportSbomUseCase {
  SbomImportResult importSbom(SbomImportCommand command);
}
