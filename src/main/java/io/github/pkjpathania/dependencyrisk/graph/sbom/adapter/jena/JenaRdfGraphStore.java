package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.jena;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ImportedBomIdentity;
import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.SbomPersistenceException;
import io.github.pkjpathania.dependencyrisk.graph.sbom.port.RdfGraphStore;
import org.apache.jena.query.Dataset;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public final class JenaRdfGraphStore implements RdfGraphStore {
  private final Dataset dataset;

  public JenaRdfGraphStore(Dataset dataset) {
    this.dataset = dataset;
  }

  @Override
  public void save(ImportedBomIdentity identity, Model model) {
    try {
      dataset.executeWrite(
          () -> {
            Model portfolio = dataset.getDefaultModel();
            Resource incomingImport = findImport(model, identity.importId());
            Resource application =
                incomingImport.getPropertyResourceValue(RiskVocabulary.IMPORTS_APPLICATION);
            portfolio
                .listResourcesWithProperty(RiskVocabulary.IMPORT_ID, identity.importId())
                .toSet()
                .forEach(previous -> removeImport(portfolio, previous));
            if (application != null) {
              portfolio.removeAll(
                  portfolio.getResource(application.getURI()), RiskVocabulary.ACTIVE_IMPORT, null);
            }
            portfolio.add(model);
            if (application != null) {
              portfolio
                  .getResource(application.getURI())
                  .addProperty(
                      RiskVocabulary.ACTIVE_IMPORT,
                      portfolio.getResource(incomingImport.getURI()));
            }
          });
    } catch (RuntimeException exception) {
      throw new SbomPersistenceException(
          "Failed to atomically persist SBOM import " + identity.importId(), exception);
    }
  }

  @Override
  public void deleteImport(String importId) {
    try {
      dataset.executeWrite(
          () -> {
            Model portfolio = dataset.getDefaultModel();
            portfolio
                .listResourcesWithProperty(RiskVocabulary.IMPORT_ID, importId)
                .toSet()
                .forEach(resource -> removeImport(portfolio, resource));
          });
    } catch (RuntimeException exception) {
      throw new SbomPersistenceException("Failed to delete SBOM import " + importId, exception);
    }
  }

  private Resource findImport(Model model, String importId) {
    return model
        .listResourcesWithProperty(RiskVocabulary.IMPORT_ID, importId)
        .nextOptional()
        .orElseThrow(() -> new IllegalArgumentException("RDF model has no SBOM import resource"));
  }

  private String literal(Resource resource, org.apache.jena.rdf.model.Property property) {
    Statement statement = resource.getProperty(property);
    return statement == null || !statement.getObject().isLiteral()
        ? null
        : statement.getString();
  }

  private void removeImport(Model model, Resource importResource) {
    Set<Resource> scopedResources =
        new LinkedHashSet<>(
            model.listResourcesWithProperty(RiskVocabulary.BELONGS_TO_IMPORT, importResource).toSet());
    for (Resource resource : scopedResources) {
      model.removeAll(resource, null, (RDFNode) null);
      model.removeAll(null, null, resource);
    }
    model.removeAll(importResource, null, (RDFNode) null);
    model.removeAll(null, null, importResource);
  }
}
