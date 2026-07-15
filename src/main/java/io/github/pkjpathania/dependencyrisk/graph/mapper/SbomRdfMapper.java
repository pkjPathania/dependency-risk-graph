package io.github.pkjpathania.dependencyrisk.graph.mapper;

import io.github.pkjpathania.dependencyrisk.ingestion.model.NormalizedSbom;
import org.apache.jena.rdf.model.Model;

public interface SbomRdfMapper {
  Model map(NormalizedSbom sbom);
}
