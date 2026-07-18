package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ImportedBomIdentity;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ResourceIdentity;
import java.util.Optional;
import org.cyclonedx.model.Component;

/** Separates import-scoped occurrence identity from canonical package-version identity. */
public interface RdfResourceIdentityStrategy {
  ResourceIdentity identifyOccurrence(String importId, String bomRef);

  Optional<ResourceIdentity> identifyPackageVersion(Component component);

  ResourceIdentity identifyApplication(Component component, String fallbackIdentity);

  ResourceIdentity identifyImport(ImportedBomIdentity identity);
}
