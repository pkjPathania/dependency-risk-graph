package io.github.pkjpathania.dependencyrisk.graph.sbom.port;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ImportedBomIdentity;
import org.apache.jena.rdf.model.Model;

/** Output boundary for atomic default-graph persistence and isolated import removal. */
public interface RdfGraphStore {
  void save(ImportedBomIdentity identity, Model model);

  void deleteImport(String importId);
}
