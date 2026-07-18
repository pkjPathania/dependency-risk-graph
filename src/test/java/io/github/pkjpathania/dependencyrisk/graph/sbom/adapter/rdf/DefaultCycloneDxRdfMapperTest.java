package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.cyclonedx.CycloneDxGraphAnalyzer;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.DependencyInformationStatus;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfImportContext;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfMappingResult;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.UnresolvedReferenceIssue;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.cyclonedx.model.Bom;
import org.cyclonedx.model.BomReference;
import org.cyclonedx.model.Component;
import org.cyclonedx.model.Composition;
import org.cyclonedx.model.Dependency;
import org.cyclonedx.model.Metadata;
import org.cyclonedx.model.vulnerability.Vulnerability;
import org.junit.jupiter.api.Test;

class DefaultCycloneDxRdfMapperTest {
  private final DefaultCycloneDxRdfMapper mapper = mapper();

  @Test
  void mapsMetadataRootEvenWhenAbsentFromComponents() {
    RdfMappingResult result = mapper.map(bomWithDirectDependency(), context("one"));
    Resource root = byBomRef(result.model(), "root");

    assertTrue(root.hasProperty(RDF.type, RiskVocabulary.APPLICATION_OCCURRENCE));
    assertTrue(
        root.getPropertyResourceValue(RiskVocabulary.INSTANCE_OF)
            .hasProperty(RDF.type, RiskVocabulary.APPLICATION));
    assertEquals("root", root.getProperty(RiskVocabulary.BOM_REF).getString());
  }

  @Test
  void preservesPurlSeparatelyFromBomRef() {
    Bom bom = bomWithDirectDependency();
    Component target = bom.getComponents().getFirst();
    target.setBomRef("internal-target-ref");
    target.setPurl("pkg:maven/org.example/target@2?type=jar");
    bom.setDependencies(
        List.of(dependency("root", "internal-target-ref"), dependency("internal-target-ref")));

    Model model = mapper.map(bom, context("two")).model();
    Resource occurrence = byBomRef(model, "internal-target-ref");
    Resource resource = occurrence.getPropertyResourceValue(RiskVocabulary.INSTANCE_OF);
    assertEquals(
        "pkg:maven/org.example/target@2?type=jar",
        resource.getProperty(RiskVocabulary.PURL).getString());
  }

  @Test
  void mapsDirectAndDeepExplicitEdgesWithoutFlattening() {
    Bom bom = bomWithDeepDependency();
    Model model = mapper.map(bom, context("deep")).model();
    Resource root = byBomRef(model, "root");
    Resource module = byBomRef(model, "module");
    Resource target = byBomRef(model, "target");

    assertTrue(model.contains(root, RiskVocabulary.DEPENDS_ON, module));
    assertTrue(model.contains(module, RiskVocabulary.DEPENDS_ON, target));
    assertFalse(model.contains(root, RiskVocabulary.DEPENDS_ON, target));
    assertTrue(
        QueryExecution.model(model)
            .query(
                "ASK { <"
                    + root.getURI()
                    + "> <"
                    + RiskVocabulary.DEPENDS_ON.getURI()
                    + ">+ <"
                    + target.getURI()
                    + "> }")
            .build()
            .execAsk());
  }

  @Test
  void distinguishesDeclaredLeafFromUnknownDependencyInformation() {
    Bom bom = bomWithDirectDependency();
    Component opaque = component("opaque", "opaque", null);
    bom.setComponents(new ArrayList<>(bom.getComponents()));
    bom.addComponent(opaque);

    var diagnostics = mapper.map(bom, context("status")).diagnostics();
    assertEquals(
        DependencyInformationStatus.DECLARED_LEAF,
        diagnostics.dependencyInformationByBomRef().get("target"));
    assertEquals(
        DependencyInformationStatus.DEPENDENCY_INFORMATION_UNKNOWN,
        diagnostics.dependencyInformationByBomRef().get("opaque"));
  }

  @Test
  void unresolvedReferenceCreatesIssueAndNoFabricatedResourceOrEdge() {
    Bom bom = bomWithDirectDependency();
    bom.getDependencies().getFirst().addDependency(new Dependency("missing"));
    RdfMappingResult result = mapper.map(bom, context("missing"));

    assertTrue(
        result.diagnostics().issues().stream()
            .anyMatch(issue -> issue instanceof UnresolvedReferenceIssue));
    assertFalse(
        result.model().listResourcesWithProperty(RiskVocabulary.BOM_REF, "missing").hasNext());
  }

  @Test
  void componentWithoutPurlUsesImportScopedIri() {
    Bom bom = bomWithDirectDependency();
    String first = byBomRef(mapper.map(bom, context("import-a")).model(), "target").getURI();
    String second = byBomRef(mapper.map(bom, context("import-b")).model(), "target").getURI();
    assertNotEquals(first, second);
  }

  @Test
  void samePurlSharesPackageButNeverOccurrenceOrDependencyIdentity() {
    Bom bom = bomWithDirectDependency();
    bom.getComponents().getFirst().setPurl("pkg:maven/org.example/target@1");
    Model first = mapper.map(bom, context("shared-a")).model();
    Model second = mapper.map(bom, context("shared-b")).model();
    Resource firstOccurrence = byBomRef(first, "target");
    Resource secondOccurrence = byBomRef(second, "target");

    assertNotEquals(firstOccurrence.getURI(), secondOccurrence.getURI());
    assertEquals(
        firstOccurrence.getPropertyResourceValue(RiskVocabulary.INSTANCE_OF).getURI(),
        secondOccurrence.getPropertyResourceValue(RiskVocabulary.INSTANCE_OF).getURI());
    assertFalse(
        firstOccurrence
            .getPropertyResourceValue(RiskVocabulary.INSTANCE_OF)
            .hasProperty(RiskVocabulary.DEPENDS_ON));
  }

  @Test
  void duplicateBomRefIsDiagnosed() {
    Bom bom = bomWithDirectDependency();
    bom.setComponents(new ArrayList<>(bom.getComponents()));
    bom.addComponent(component("target", "duplicate", null));
    assertEquals(1, mapper.map(bom, context("duplicate")).diagnostics().duplicateBomRefCount());
  }

  @Test
  void mapsEmbeddedVulnerabilityAffectedComponentReference() {
    Bom bom = bomWithDirectDependency();
    bom.getComponents().getFirst().setPurl("pkg:maven/org.example/target@1");
    Vulnerability vulnerability = new Vulnerability();
    vulnerability.setId("CVE-TEST-1");
    Vulnerability.Affect affect = new Vulnerability.Affect();
    affect.setRef("target");
    vulnerability.setAffects(List.of(affect));
    bom.setVulnerabilities(List.of(vulnerability));
    Model model = mapper.map(bom, context("vulnerability")).model();

    Resource target = byBomRef(model, "target");
    Resource packageResource = target.getPropertyResourceValue(RiskVocabulary.INSTANCE_OF);
    assertTrue(model.contains(packageResource, RiskVocabulary.AFFECTED_BY));
  }

  @Test
  void preservesCompositionAndAssemblyReference() {
    Bom bom = bomWithDirectDependency();
    Composition composition = new Composition();
    composition.setAggregate(Composition.Aggregate.COMPLETE);
    composition.addAssembly(new BomReference("target"));
    bom.setCompositions(List.of(composition));
    Model model = mapper.map(bom, context("composition")).model();

    Resource compositionResource =
        model.listResourcesWithProperty(RDF.type, RiskVocabulary.COMPOSITION).next();
    assertEquals(
        "COMPLETE",
        compositionResource.getProperty(RiskVocabulary.COMPOSITION_AGGREGATE).getString());
    assertTrue(model.contains(compositionResource, RiskVocabulary.HAS_ASSEMBLY, byBomRef(model, "target")));
  }

  private static DefaultCycloneDxRdfMapper mapper() {
    CycloneDxGraphAnalyzer analyzer = new CycloneDxGraphAnalyzer();
    ComponentMapper componentMapper = new ComponentMapper();
    return new DefaultCycloneDxRdfMapper(
        analyzer,
        new DefaultRdfResourceIdentityStrategy(),
        new MetadataComponentMapper(componentMapper),
        componentMapper,
        new ServiceMapper(),
        new DependencyMapper(),
        new VulnerabilityMapper(),
        new CompositionMapper());
  }

  private static Bom bomWithDirectDependency() {
    Bom bom = baseBom();
    Component target = component("target", "target", null);
    bom.setComponents(List.of(target));
    bom.setDependencies(
        List.of(dependency("root", "target"), dependency("target")));
    return bom;
  }

  private static Bom bomWithDeepDependency() {
    Bom bom = baseBom();
    bom.setComponents(
        List.of(component("module", "module", null), component("target", "target", null)));
    bom.setDependencies(
        List.of(
            dependency("root", "module"),
            dependency("module", "target"),
            dependency("target")));
    return bom;
  }

  private static Bom baseBom() {
    Bom bom = new Bom();
    Metadata metadata = new Metadata();
    metadata.setComponent(component("root", "root", "pkg:maven/org.example/root@1"));
    bom.setMetadata(metadata);
    return bom;
  }

  private static Component component(String bomRef, String name, String purl) {
    Component component = new Component();
    component.setType(Component.Type.LIBRARY);
    component.setBomRef(bomRef);
    component.setGroup("org.example");
    component.setName(name);
    component.setVersion("1");
    component.setPurl(purl);
    return component;
  }

  private static Dependency dependency(String parent, String... children) {
    Dependency dependency = new Dependency(parent);
    for (String child : children) {
      dependency.addDependency(new Dependency(child));
    }
    return dependency;
  }

  private static RdfImportContext context(String importId) {
    return new RdfImportContext(
        importId, "1.6", "test.json", "TEST", "abc", Instant.EPOCH, null);
  }

  private static Resource byBomRef(Model model, String bomRef) {
    return model.listResourcesWithProperty(RiskVocabulary.BOM_REF, bomRef).next();
  }
}
