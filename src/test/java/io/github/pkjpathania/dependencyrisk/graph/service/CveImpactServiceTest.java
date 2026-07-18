package io.github.pkjpathania.dependencyrisk.graph.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactDetailResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactListResponse;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
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
        fixture.firstApplicationIri,
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

    assertEquals(1, list.total());
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
  void detailIncludesCvssFixedVersionAndMergedSharedEdges() {
    Fixture fixture = fixture();

    CveImpactDetailResponse detail = fixture.service.detail(fixture.vulnerabilityIri, "all", null);

    assertEquals(1, detail.cvssAssessments().size());
    assertEquals("3.1", detail.cvssAssessments().getFirst().version());
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
    JenaGraphRepository repository = new JenaGraphRepository(dataset, new ObjectMapper());
    DependencyPathService pathService =
        new DependencyPathService(new DependencyGraphIndex(repository));
    return new Fixture(
        new CveImpactService(repository, pathService),
        firstApplicationIri,
        vulnerabilityIri);
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
    firstApplication.addProperty(RiskVocabulary.DEPENDS_ON, firstPackage);
    secondApplication.addProperty(RiskVocabulary.DEPENDS_ON, bridge);
    bridge.addProperty(RiskVocabulary.DEPENDS_ON, secondPackage);

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

    Resource assessment =
        model.createResource("urn:test:impact:assessment")
            .addProperty(RDF.type, RiskVocabulary.CVSS_ASSESSMENT)
            .addProperty(RiskVocabulary.CVSS_TYPE, "CVSS_V3")
            .addProperty(RiskVocabulary.CVSS_VERSION, "3.1")
            .addProperty(RiskVocabulary.VECTOR, "CVSS:3.1/AV:N/AC:L");
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

  private record Fixture(
      CveImpactService service, String firstApplicationIri, String vulnerabilityIri) {}
}
