package io.github.pkjpathania.dependencyrisk.graph.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathResult;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathStatus;
import io.github.pkjpathania.dependencyrisk.graph.model.ImportContext;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaPackageOccurrenceRepository;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class JenaDependencyPathResolverTest {

  @Test
  void resolvesOnlyTheSelectedImportWhenCanonicalPackageIsShared() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(
        () -> {
          Model model = dataset.getDefaultModel();
          ImportGraph first = importGraph(model, "one", "shared");
          ImportGraph second = importGraph(model, "two", "shared");
          first.root().addProperty(RiskVocabulary.DEPENDS_ON, first.middle());
          first.middle().addProperty(RiskVocabulary.DEPENDS_ON, first.target());
          second.root().addProperty(RiskVocabulary.DEPENDS_ON, second.target());
          // A tempting cross-import shortcut must never be traversed.
          first.root().addProperty(RiskVocabulary.DEPENDS_ON, second.target());
        });

    DependencyPathResult result = resolver(dataset).resolve(context("one"), iri("package:shared"));

    assertEquals(DependencyPathStatus.PATH_RESOLVED, result.status());
    assertEquals(
        java.util.List.of(iri("occurrence:one:root"), iri("occurrence:one:middle"), iri("occurrence:one:target")),
        result.path().stream().map(node -> node.occurrenceIri()).toList());
  }

  @Test
  void reportsCanonicalPackageAbsentFromSelectedImport() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(() -> importGraph(dataset.getDefaultModel(), "one", "other"));
    assertEquals(
        DependencyPathStatus.TARGET_PACKAGE_NOT_FOUND_IN_IMPORT,
        resolver(dataset).resolve(context("one"), iri("package:shared")).status());
  }

  @Test
  void reportsOccurrenceInImportButUnreachable() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(() -> importGraph(dataset.getDefaultModel(), "one", "shared"));
    assertEquals(
        DependencyPathStatus.TARGET_OCCURRENCE_UNREACHABLE,
        resolver(dataset).resolve(context("one"), iri("package:shared")).status());
  }

  @Test
  void reportsMissingPersistedRoot() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(() -> importGraph(dataset.getDefaultModel(), "one", "shared"));
    ImportContext missing = new ImportContext("one", iri("import:one"), iri("occurrence:missing"));
    assertEquals(
        DependencyPathStatus.ROOT_OCCURRENCE_NOT_FOUND,
        resolver(dataset).resolve(missing, iri("package:shared")).status());
  }

  private JenaDependencyPathResolver resolver(Dataset dataset) {
    JenaGraphRepository repository = new JenaGraphRepository(dataset, new ObjectMapper());
    return new JenaDependencyPathResolver(repository, new JenaPackageOccurrenceRepository(repository));
  }

  private ImportGraph importGraph(Model model, String importId, String packageId) {
    Resource run = model.createResource(iri("import:" + importId))
        .addProperty(RDF.type, RiskVocabulary.IMPORT_RUN)
        .addLiteral(RiskVocabulary.IMPORT_ID, importId);
    Resource root = occurrence(model, run, importId + ":root", RiskVocabulary.APPLICATION_OCCURRENCE);
    Resource middle = occurrence(model, run, importId + ":middle", RiskVocabulary.PACKAGE_OCCURRENCE);
    Resource target = occurrence(model, run, importId + ":target", RiskVocabulary.PACKAGE_OCCURRENCE);
    Resource canonical = model.createResource(iri("package:" + packageId))
        .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION);
    target.addProperty(RiskVocabulary.INSTANCE_OF, canonical);
    run.addProperty(RiskVocabulary.ROOT_OCCURRENCE, root);
    return new ImportGraph(root, middle, target);
  }

  private Resource occurrence(Model model, Resource run, String id, Resource type) {
    return model.createResource(iri("occurrence:" + id))
        .addProperty(RDF.type, type)
        .addProperty(RiskVocabulary.BELONGS_TO_IMPORT, run);
  }

  private ImportContext context(String importId) {
    return new ImportContext(importId, iri("import:" + importId), iri("occurrence:" + importId + ":root"));
  }

  private String iri(String suffix) {
    return "urn:test:" + suffix;
  }

  private record ImportGraph(Resource root, Resource middle, Resource target) {}
}
