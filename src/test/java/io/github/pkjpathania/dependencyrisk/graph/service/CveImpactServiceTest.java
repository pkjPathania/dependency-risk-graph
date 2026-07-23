package io.github.pkjpathania.dependencyrisk.graph.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactDetailResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactListResponse;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaImportContextRepository;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaPackageOccurrenceRepository;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class CveImpactServiceTest {

  @Test
  void graphAggregationPreservesSemanticRelationshipsFromExposureEdgeIds() {
    Dataset dataset = DatasetFactory.createTxnMem();
    String occurrence6d5f = "urn:io.github.pkjpathania.dependencyrisk:resource:occurrence:6d5f1111";
    String occurrenceF639 = "urn:io.github.pkjpathania.dependencyrisk:resource:occurrence:f6392222";
    String occurrence5c588 = "urn:io.github.pkjpathania.dependencyrisk:resource:occurrence:5c5883333";
    String packageF886 = "urn:io.github.pkjpathania.dependencyrisk:resource:package:f8864444";
    String packageF9b8 = "urn:io.github.pkjpathania.dependencyrisk:resource:package:f9b85555";
    String vulnerability = "urn:io.github.pkjpathania.dependencyrisk:resource:vulnerability:cve-impact";
    String fixedF90a = "urn:io.github.pkjpathania.dependencyrisk:resource:package-version:f90a6666";
    dataset.executeWrite(
        () ->
            populateAggregationFixture(
                dataset.getDefaultModel(),
                occurrence6d5f,
                occurrenceF639,
                occurrence5c588,
                packageF886,
                packageF9b8,
                vulnerability,
                fixedF90a));

    CveImpactDetailResponse detail = service(dataset).detail(vulnerability, "all", null);

    assertEdge(detail, occurrence6d5f, "INSTANCE_OF", packageF886);
    assertEdge(detail, occurrenceF639, "INSTANCE_OF", packageF9b8);
    assertEdge(detail, occurrence5c588, "INSTANCE_OF", packageF9b8);
    assertNoEdge(detail, occurrence6d5f, "DEPENDS_ON", packageF886);
    assertNoEdge(detail, occurrenceF639, "DEPENDS_ON", packageF9b8);
    assertNoEdge(detail, occurrence5c588, "DEPENDS_ON", packageF9b8);
    assertEdge(detail, packageF886, "AFFECTED_BY", vulnerability);
    assertEdge(detail, packageF9b8, "AFFECTED_BY", vulnerability);
    assertEdge(detail, vulnerability, "FIXED_IN", fixedF90a);
    assertTrue(
        detail.exposures().stream()
            .allMatch(
                exposure ->
                    exposure.dependencyHops()
                        == exposure.pathEdgeIds().stream()
                            .filter(id -> id.split("\u0000", -1)[1].equals("DEPENDS_ON"))
                            .count()));
    assertTrue(
        detail.graph().edges().stream()
            .allMatch(
                edge ->
                    edge.id()
                        .equals(
                            edge.source()
                                + "\u0000"
                                + edge.relationship()
                                + "\u0000"
                                + edge.target())));
    assertTrue(
        detail.exposures().stream()
            .flatMap(exposure -> exposure.pathEdgeIds().stream())
            .allMatch(
                pathEdgeId ->
                    detail.graph().edges().stream()
                        .anyMatch(
                            edge ->
                                edge.id().equals(pathEdgeId)
                                    && edge.relationship()
                                        .equals(pathEdgeId.split("\u0000", -1)[1]))));
  }

  @Test
  void selectedScopeReturnsOneGroupedVulnerabilityAndOneDirectExposure() {
    Fixture fixture = fixture();

    CveImpactListResponse list = fixture.service.list("selected", fixture.firstApplicationIri);
    CveImpactDetailResponse detail =
        fixture.service.detail(fixture.vulnerabilityIri, "selected", fixture.firstApplicationIri);

    assertEquals(1, list.total());
    assertEquals("CVE-2026-1000", list.items().getFirst().preferredIdentifier());
    assertEquals(1, list.items().getFirst().affectedApplicationCount());
    assertEquals(1, list.items().getFirst().affectedPackageVersionCount());
    assertEquals(1, detail.exposures().size());
    assertEquals("DIRECT", detail.exposures().getFirst().dependencyType());
    assertEquals(1, detail.exposures().getFirst().dependencyHops());
    assertEquals(
        "urn:test:impact:root:one",
        detail.exposures().getFirst().path().getFirst().iri());
    assertEquals(
        fixture.vulnerabilityIri,
        detail.exposures().getFirst().path().getLast().iri());
  }

  @Test
  void allScopePreservesApplicationsAndInstalledVersionsAroundOneVulnerability() {
    Fixture fixture = fixture();

    CveImpactListResponse list = fixture.service.list("all", null);
    CveImpactDetailResponse detail = fixture.service.detail(fixture.vulnerabilityIri, "all", null);

    assertEquals(2, list.total());
    assertEquals(2, list.items().getFirst().affectedApplicationCount());
    assertEquals(2, list.items().getFirst().affectedPackageVersionCount());
    assertEquals(2, detail.exposures().size());
    assertEquals(2, detail.vulnerability().affectedApplicationCount());
    assertEquals(2, detail.vulnerability().affectedPackageVersionCount());
    assertEquals(1, detail.graph().nodes().stream().filter(node -> node.nodeType().equals("VULNERABILITY")).count());
    assertEquals(2, detail.graph().nodes().stream().filter(node -> node.nodeType().equals("VULNERABLE_PACKAGE")).count());
    assertTrue(detail.exposures().stream().anyMatch(exposure -> exposure.dependencyType().equals("TRANSITIVE")));
  }

  @Test
  void allScopeSortsVulnerabilitiesByAffectedApplicationCountDescending() {
    Fixture fixture = fixture();

    CveImpactListResponse list = fixture.service.list("all", null);

    assertEquals("CVE-2026-1000", list.items().get(0).preferredIdentifier());
    assertEquals(2, list.items().get(0).affectedApplicationCount());
    assertEquals("CRITICAL", list.items().get(0).cvssSeverity());
    assertEquals("CVE-2026-2000", list.items().get(1).preferredIdentifier());
    assertEquals(1, list.items().get(1).affectedApplicationCount());
  }

  @Test
  void detailIncludesCvssFixedVersionAndMergedSharedEdges() {
    Fixture fixture = fixture();

    CveImpactDetailResponse detail = fixture.service.detail(fixture.vulnerabilityIri, "all", null);

    assertEquals(1, detail.cvssAssessments().size());
    assertEquals("CVSS:3.1", detail.cvssAssessments().getFirst().cvss().getName());
    assertEquals(9.8, detail.cvssAssessments().getFirst().cvss().calculateScore().getBaseScore());
    assertEquals(1, detail.fixedVersions().size());
    assertTrue(detail.graph().edges().stream().anyMatch(edge -> edge.relationship().equals("FIXED_IN")));
    assertTrue(detail.graph().edges().stream().anyMatch(edge -> edge.relationship().equals("AFFECTED_BY")));
    assertEquals(2, detail.referenceUrls().size());
  }

  private Fixture fixture() {
    Dataset dataset = DatasetFactory.createTxnMem();
    String firstApplicationIri = "urn:test:impact:application:one";
    String secondApplicationIri = "urn:test:impact:application:two";
    String vulnerabilityIri = "urn:test:impact:vulnerability";
    dataset.executeWrite(
        () -> populate(dataset.getDefaultModel(), firstApplicationIri, secondApplicationIri, vulnerabilityIri));
    return new Fixture(service(dataset), firstApplicationIri, vulnerabilityIri);
  }

  private CveImpactService service(Dataset dataset) {
    JenaGraphRepository repository = new JenaGraphRepository(dataset, new ObjectMapper());
    JenaImportContextRepository contexts = new JenaImportContextRepository(repository);
    JenaPackageOccurrenceRepository occurrences = new JenaPackageOccurrenceRepository(repository);
    return new CveImpactService(
        repository,
        contexts,
        occurrences,
        new JenaDependencyPathResolver(repository, occurrences));
  }

  private void populateAggregationFixture(
      Model model,
      String occurrence6d5f,
      String occurrenceF639,
      String occurrence5c588,
      String packageF886,
      String packageF9b8,
      String vulnerabilityIri,
      String fixedF90a) {
    Resource vulnerability =
        model.createResource(vulnerabilityIri)
            .addProperty(RDF.type, RiskVocabulary.VULNERABILITY)
            .addProperty(RiskVocabulary.OSV_ID, "CVE-2026-AGGREGATION");
    Resource firstPackage = packageVersion(model, packageF886, "first", "1.0");
    Resource sharedPackage = packageVersion(model, packageF9b8, "shared", "2.0");
    Resource fixedPackage = packageVersion(model, fixedF90a, "shared", "2.1");
    firstPackage.addProperty(RiskVocabulary.AFFECTED_BY, vulnerability);
    sharedPackage.addProperty(RiskVocabulary.AFFECTED_BY, vulnerability);
    vulnerability.addProperty(RiskVocabulary.FIXED_IN, fixedPackage);
    addDirectExposure(model, "aggregation-one", occurrence6d5f, firstPackage);
    addDirectExposure(model, "aggregation-two", occurrenceF639, sharedPackage);
    addDirectExposure(model, "aggregation-three", occurrence5c588, sharedPackage);
  }

  private void addDirectExposure(
      Model model, String id, String occurrenceIri, Resource packageVersion) {
    Resource application =
        application(model, "urn:test:aggregation:application:" + id, id, "1.0");
    Resource run =
        importRun(model, application, id, "urn:test:aggregation:root:" + id);
    Resource occurrence = occurrence(model, occurrenceIri, packageVersion, run);
    run.getPropertyResourceValue(RiskVocabulary.ROOT_OCCURRENCE)
        .addProperty(RiskVocabulary.DEPENDS_ON, occurrence);
  }

  private void assertEdge(
      CveImpactDetailResponse detail, String source, String relationship, String target) {
    assertTrue(
        detail.graph().edges().stream()
            .anyMatch(
                edge ->
                    edge.source().equals(source)
                        && edge.relationship().equals(relationship)
                        && edge.target().equals(target)));
  }

  private void assertNoEdge(
      CveImpactDetailResponse detail, String source, String relationship, String target) {
    assertFalse(
        detail.graph().edges().stream()
            .anyMatch(
                edge ->
                    edge.source().equals(source)
                        && edge.relationship().equals(relationship)
                        && edge.target().equals(target)));
  }

  private void populate(
      Model model,
      String firstApplicationIri,
      String secondApplicationIri,
      String vulnerabilityIri) {
    Resource firstApplication = application(model, firstApplicationIri, "Orders", "1.0");
    Resource secondApplication = application(model, secondApplicationIri, "Analytics", "2.0");
    Resource bridge = packageVersion(model, "urn:test:impact:bridge", "reporting", "5.0");
    Resource firstPackage = packageVersion(model, "urn:test:impact:jackson:210", "jackson-databind", "2.10.0");
    Resource secondPackage = packageVersion(model, "urn:test:impact:jackson:298", "jackson-databind", "2.9.8");
    Resource firstRun = importRun(model, firstApplication, "one", "urn:test:impact:root:one");
    Resource secondRun = importRun(model, secondApplication, "two", "urn:test:impact:root:two");
    Resource firstRoot = firstRun.getPropertyResourceValue(RiskVocabulary.ROOT_OCCURRENCE);
    Resource secondRoot = secondRun.getPropertyResourceValue(RiskVocabulary.ROOT_OCCURRENCE);
    Resource bridgeOccurrence = occurrence(model, "urn:test:impact:occurrence:bridge", bridge, secondRun);
    Resource firstOccurrence = occurrence(model, "urn:test:impact:occurrence:jackson:210", firstPackage, firstRun);
    Resource secondOccurrence = occurrence(model, "urn:test:impact:occurrence:jackson:298", secondPackage, secondRun);
    firstRoot.addProperty(RiskVocabulary.DEPENDS_ON, firstOccurrence);
    secondRoot.addProperty(RiskVocabulary.DEPENDS_ON, bridgeOccurrence);
    bridgeOccurrence.addProperty(RiskVocabulary.DEPENDS_ON, secondOccurrence);

    Resource vulnerability =
        model.createResource(vulnerabilityIri)
            .addProperty(RDF.type, RiskVocabulary.VULNERABILITY)
            .addProperty(RiskVocabulary.OSV_ID, "GHSA-IMPACT")
            .addProperty(RiskVocabulary.ALIAS, "CVE-2026-1000")
            .addProperty(RiskVocabulary.SUMMARY, "Shared Jackson vulnerability")
            .addProperty(RiskVocabulary.DETAILS, "Full advisory details")
            .addProperty(RiskVocabulary.SEVERITY_LEVEL, "HIGH")
            .addProperty(RiskVocabulary.REFERENCE_URL, "https://nvd.nist.gov/vuln/detail/CVE-2026-1000")
            .addProperty(RiskVocabulary.REFERENCE_URL, "https://github.com/example/repo/commit/fix");
    firstPackage.addProperty(RiskVocabulary.AFFECTED_BY, vulnerability);
    secondPackage.addProperty(RiskVocabulary.AFFECTED_BY, vulnerability);

    Resource singleApplicationVulnerability =
        model.createResource("urn:test:impact:single-application-vulnerability")
            .addProperty(RDF.type, RiskVocabulary.VULNERABILITY)
            .addProperty(RiskVocabulary.OSV_ID, "GHSA-SINGLE")
            .addProperty(RiskVocabulary.ALIAS, "CVE-2026-2000")
            .addProperty(RiskVocabulary.SUMMARY, "Single application vulnerability")
            .addProperty(RiskVocabulary.SEVERITY_LEVEL, "MEDIUM");
    bridge.addProperty(RiskVocabulary.AFFECTED_BY, singleApplicationVulnerability);

    Resource assessment =
        model.createResource("urn:test:impact:assessment")
            .addProperty(RDF.type, RiskVocabulary.CVSS_ASSESSMENT)
            .addProperty(RiskVocabulary.CVSS_TYPE, "CVSS_V3")
            .addProperty(RiskVocabulary.CVSS_VERSION, "3.1")
            .addProperty(
                RiskVocabulary.VECTOR,
                "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
    vulnerability.addProperty(RiskVocabulary.HAS_SEVERITY, assessment);

    Resource fixed = packageVersion(model, "urn:test:impact:jackson:fixed", "jackson-databind", "2.10.5");
    vulnerability.addProperty(RiskVocabulary.FIXED_IN, fixed);
  }

  private Resource application(Model model, String iri, String name, String version) {
    return model.createResource(iri)
        .addProperty(RDF.type, RiskVocabulary.APPLICATION)
        .addProperty(RDFS.label, name)
        .addProperty(RiskVocabulary.VERSION, version);
  }

  private Resource packageVersion(Model model, String iri, String name, String version) {
    return model.createResource(iri)
        .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
        .addProperty(RDFS.label, name)
        .addProperty(RiskVocabulary.VERSION, version)
        .addProperty(RiskVocabulary.PURL, "pkg:maven/example/" + name + "@" + version);
  }

  private Resource importRun(Model model, Resource application, String id, String rootIri) {
    Resource run = model.createResource("urn:test:impact:import:" + id)
        .addProperty(RDF.type, RiskVocabulary.IMPORT_RUN)
        .addLiteral(RiskVocabulary.IMPORT_ID, id);
    Resource root = model.createResource(rootIri)
        .addProperty(RDF.type, RiskVocabulary.APPLICATION_OCCURRENCE)
        .addProperty(RDFS.label, application.getProperty(RDFS.label).getString())
        .addProperty(RiskVocabulary.BELONGS_TO_IMPORT, run)
        .addProperty(RiskVocabulary.INSTANCE_OF, application);
    run.addProperty(RiskVocabulary.ROOT_OCCURRENCE, root);
    application.addProperty(RiskVocabulary.ACTIVE_IMPORT, run);
    return run;
  }

  private Resource occurrence(Model model, String iri, Resource packageVersion, Resource importRun) {
    return model.createResource(iri)
        .addProperty(RDF.type, RiskVocabulary.PACKAGE_OCCURRENCE)
        .addProperty(RiskVocabulary.BELONGS_TO_IMPORT, importRun)
        .addProperty(RDFS.label, packageVersion.getProperty(RDFS.label).getString())
        .addProperty(
            RiskVocabulary.VERSION,
            packageVersion.getProperty(RiskVocabulary.VERSION).getString())
        .addProperty(RiskVocabulary.INSTANCE_OF, packageVersion);
  }

  private record Fixture(
      CveImpactService service, String firstApplicationIri, String vulnerabilityIri) {}
}
