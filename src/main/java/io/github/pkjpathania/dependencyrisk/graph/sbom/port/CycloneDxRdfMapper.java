package io.github.pkjpathania.dependencyrisk.graph.sbom.port;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfImportContext;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfMappingResult;
import org.cyclonedx.model.Bom;

/** Maps an official CycloneDX {@link Bom} directly into an import-scoped RDF model. */
public interface CycloneDxRdfMapper {
  RdfMappingResult map(Bom bom, RdfImportContext importContext);
}
