package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.jena;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ImportedBomIdentity;
import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.SbomPersistenceException;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.time.Instant;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.junit.jupiter.api.Test;

class JenaRdfGraphStoreTest {

  @Test
  void storesOnlyInDefaultGraph() {
    Dataset dataset = DatasetFactory.createTxnMem();
    JenaRdfGraphStore store = new JenaRdfGraphStore(dataset);

    store.save(identity("one"), importModel("one", "app-one", "shared"));

    assertTrue(dataset.getDefaultModel().containsResource(resource("import:one")));
    assertFalse(dataset.listNames().hasNext());
    dataset.close();
  }

  @Test
  void occurrencesAreDistinctWhileCanonicalPackageIsShared() {
    Dataset dataset = DatasetFactory.createTxnMem();
    JenaRdfGraphStore store = new JenaRdfGraphStore(dataset);
    store.save(identity("one"), importModel("one", "app-one", "shared"));
    store.save(identity("two"), importModel("two", "app-two", "shared"));

    Model portfolio = dataset.getDefaultModel();
    assertTrue(portfolio.contains(resource("occurrence:one"), RiskVocabulary.INSTANCE_OF, resource("package:shared")));
    assertTrue(portfolio.contains(resource("occurrence:two"), RiskVocabulary.INSTANCE_OF, resource("package:shared")));
    assertEquals(
        1,
        portfolio
            .listResourcesWithProperty(RiskVocabulary.PURL, "pkg:maven/org.example/shared@1")
            .toSet()
            .size());
    dataset.close();
  }

  @Test
  void deletingImportRetainsOtherOccurrencesSharedPackagesAndVulnerabilities() {
    Dataset dataset = DatasetFactory.createTxnMem();
    JenaRdfGraphStore store = new JenaRdfGraphStore(dataset);
    Model first = importModel("one", "app-one", "shared");
    Resource vulnerability = first.createResource("urn:test:vulnerability");
    first.add(resource(first, "package:shared"), RiskVocabulary.AFFECTED_BY, vulnerability);
    store.save(identity("one"), first);
    store.save(identity("two"), importModel("two", "app-two", "shared"));

    store.deleteImport("one");

    Model portfolio = dataset.getDefaultModel();
    assertFalse(portfolio.containsResource(resource("occurrence:one")));
    assertTrue(portfolio.containsResource(resource("occurrence:two")));
    assertTrue(portfolio.containsResource(resource("package:shared")));
    assertTrue(portfolio.containsResource(resource("vulnerability")));
    dataset.close();
  }

  @Test
  void reimportPreservesHistoryAndMovesTheActiveImport() {
    Dataset dataset = DatasetFactory.createTxnMem();
    JenaRdfGraphStore store = new JenaRdfGraphStore(dataset);
    store.save(identity("old"), importModel("old", "app-one", "old-package"));
    store.save(identity("other"), importModel("other", "app-two", "other-package"));

    store.save(identity("new"), importModel("new", "app-one", "new-package"));

    Model portfolio = dataset.getDefaultModel();
    assertTrue(portfolio.containsResource(resource("occurrence:old")));
    assertTrue(portfolio.containsResource(resource("occurrence:new")));
    assertTrue(portfolio.containsResource(resource("occurrence:other")));
    assertEquals(3, portfolio.listResourcesWithProperty(RDF.type, RiskVocabulary.SBOM_IMPORT).toSet().size());
    assertTrue(
        portfolio.contains(
            resource("application:app-one"),
            RiskVocabulary.ACTIVE_IMPORT,
            resource("import:new")));
    dataset.close();
  }

  @Test
  void portfolioQueryNeedsNoGraphClause() {
    Dataset dataset = DatasetFactory.createTxnMem();
    JenaRdfGraphStore store = new JenaRdfGraphStore(dataset);
    store.save(identity("one"), importModel("one", "app-one", "one"));
    store.save(identity("two"), importModel("two", "app-two", "two"));

    long count =
        QueryExecution.model(dataset.getDefaultModel())
            .query("SELECT (COUNT(?import) AS ?count) WHERE { ?import <" + RiskVocabulary.IMPORT_ID.getURI() + "> ?id }")
            .build()
            .execSelect()
            .next()
            .getLiteral("count")
            .getLong();
    assertEquals(2, count);
    dataset.close();
  }

  @Test
  void persistenceFailureIsWrapped() {
    Dataset dataset = DatasetFactory.createTxnMem();
    JenaRdfGraphStore store = new JenaRdfGraphStore(dataset);
    assertThrows(
        SbomPersistenceException.class,
        () -> store.save(identity("failed"), ModelFactory.createDefaultModel()));
    assertEquals(0, dataset.getDefaultModel().size());
    dataset.close();
  }

  private static Model importModel(String importId, String applicationIdentity, String packageId) {
    Model model = ModelFactory.createDefaultModel();
    Resource importResource = resource(model, "import:" + importId);
    Resource occurrence = resource(model, "occurrence:" + importId);
    Resource packageResource = resource(model, "package:" + packageId);
    Resource application = resource(model, "application:" + applicationIdentity);
    importResource.addProperty(RDF.type, RiskVocabulary.SBOM_IMPORT);
    importResource.addLiteral(RiskVocabulary.IMPORT_ID, importId);
    importResource.addLiteral(RiskVocabulary.APPLICATION_IDENTITY, applicationIdentity);
    importResource.addProperty(RiskVocabulary.IMPORTS_APPLICATION, application);
    importResource.addProperty(RiskVocabulary.ROOT_OCCURRENCE, occurrence);
    occurrence.addProperty(RDF.type, RiskVocabulary.COMPONENT_OCCURRENCE);
    occurrence.addProperty(RiskVocabulary.BELONGS_TO_IMPORT, importResource);
    occurrence.addProperty(RiskVocabulary.INSTANCE_OF, packageResource);
    packageResource.addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION);
    packageResource.addLiteral(RiskVocabulary.PURL, "pkg:maven/org.example/" + packageId + "@1");
    return model;
  }

  private static Resource resource(String suffix) {
    return ModelFactory.createDefaultModel().createResource("urn:test:" + suffix);
  }

  private static Resource resource(Model model, String suffix) {
    return model.createResource("urn:test:" + suffix);
  }

  private static ImportedBomIdentity identity(String importId) {
    return new ImportedBomIdentity(importId, null, "test.json", "hash", Instant.EPOCH);
  }
}
