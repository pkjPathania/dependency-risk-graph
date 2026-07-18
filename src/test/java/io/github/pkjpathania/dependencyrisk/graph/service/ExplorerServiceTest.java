package io.github.pkjpathania.dependencyrisk.graph.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationOverview;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationReferencesResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationVulnerabilitiesResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationVulnerabilityItem;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.util.List;
import java.util.ArrayDeque;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class ExplorerServiceTest {

  @Test
  void applicationWithoutReferencesReturnsAnEmptyResponse() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(
        () -> {
          Resource application = dataset.getDefaultModel().createResource("urn:test:no-references");
          application.addProperty(
              RiskVocabulary.DEPENDS_ON,
              dataset.getDefaultModel().createResource("urn:test:package:no-references"));
        });

    ApplicationReferencesResponse response = service(dataset).getReferences("urn:test:no-references");

    assertEquals(0, response.total());
    assertEquals(List.of(), response.items());
  }

  @Test
  void groupsReferenceExpansionByAdvisoryAndPreservesAffectedVersions() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(() -> populateReferenceGraph(dataset.getDefaultModel()));

    ApplicationReferencesResponse response =
        service(dataset).getReferences("urn:test:reference-app");

    assertEquals(2, response.total());
    var first = response.items().getFirst();
    assertEquals("GHSA-ONE", first.osvId());
    assertEquals(List.of("CVE-2026-1", "GHSA-ALIAS"), first.aliases());
    assertEquals(2, first.affectedPackages().size());
    assertEquals("alpha", first.affectedPackages().getFirst().packageName());
    assertEquals("1.0", first.affectedPackages().getFirst().installedVersion());
    assertEquals("2.0", first.affectedPackages().get(1).installedVersion());
    assertEquals(2, first.referenceUrls().size());
    assertEquals("https://github.com/example/project/security/advisories/GHSA-ONE", first.referenceUrls().getFirst());

    var second = response.items().get(1);
    assertEquals("OSV-TWO", second.osvId());
    assertEquals(List.of(), second.aliases());
    assertEquals(null, second.summary());
    assertEquals(1, second.referenceUrls().size());
  }

  @Test
  void applicationWithoutVulnerabilityTriplesReturnsAnEmptyResponse() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(
        () -> {
          Resource application = dataset.getDefaultModel().createResource("urn:test:empty-app");
          application.addProperty(
              RiskVocabulary.DEPENDS_ON,
              dataset.getDefaultModel().createResource("urn:test:clean-package"));
        });
    ExplorerService service = service(dataset);

    ApplicationVulnerabilitiesResponse response =
        service.getVulnerabilities("urn:test:empty-app");

    assertEquals(0, response.total());
    assertEquals(List.of(), response.items());
  }

  @Test
  void groupsRepeatedRowsIntoStructuredDirectAndTransitiveItems() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(() -> populateVulnerabilityGraph(dataset.getDefaultModel()));
    ExplorerService service = service(dataset);

    ApplicationVulnerabilitiesResponse response =
        service.getVulnerabilities("urn:test:vulnerable-app");

    assertEquals(2, response.total());
    ApplicationVulnerabilityItem direct = response.items().getFirst();
    assertEquals("DIRECT", direct.dependencyType());
    assertEquals(List.of("CVE-2026-1", "GHSA-ALIAS"), direct.aliases());
    assertEquals(2, direct.cvssAssessments().size());
    assertEquals(2, direct.fixedVersions().size());
    assertEquals(2, direct.referenceUrls().size());

    ApplicationVulnerabilityItem transitive = response.items().get(1);
    assertEquals("TRANSITIVE", transitive.dependencyType());
    assertEquals(List.of(), transitive.aliases());
    assertEquals(List.of(), transitive.cvssAssessments());
    assertEquals(List.of(), transitive.fixedVersions());
    assertEquals(null, transitive.publishedAt());
  }

  @Test
  void overviewReturnsDistinctVulnerablePackagesAndZeroCriticalVulnerabilities() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(() -> populateGraph(dataset.getDefaultModel()));
    ExplorerService service = service(dataset);

    ApplicationOverview overview = service.overview("urn:test:application");

    assertEquals(2L, overview.vulnerablePackages());
    assertEquals(0L, overview.criticalVulnerabilities());
  }

  @Test
  void overviewCountsDistinctCriticalVulnerabilitiesForTheSelectedApplication() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(
        () -> {
          Model model = dataset.getDefaultModel();
          populateGraph(model);
          Resource vulnerability = model.getResource("urn:test:vulnerability:one");
          Resource assessment = model.createResource("urn:test:assessment:critical");
          vulnerability.addProperty(RiskVocabulary.HAS_SEVERITY, assessment);
          assessment.addProperty(RiskVocabulary.SEVERITY_LEVEL, "critical");
        });
    ExplorerService service = service(dataset);

    ApplicationOverview overview = service.overview("urn:test:application");

    assertEquals(1L, overview.criticalVulnerabilities());
  }

  private void populateGraph(Model model) {
    Resource application = model.createResource("urn:test:application");
    Resource firstPackage = model.createResource("urn:test:package:first");
    Resource secondPackage = model.createResource("urn:test:package:second");
    Resource unrelatedPackage = model.createResource("urn:test:package:unrelated");
    Resource firstVulnerability = model.createResource("urn:test:vulnerability:one");
    Resource secondVulnerability = model.createResource("urn:test:vulnerability:two");

    Resource firstOccurrence = occurrence(model, "urn:test:occurrence:first", firstPackage);
    Resource secondOccurrence = occurrence(model, "urn:test:occurrence:second", secondPackage);
    application.addProperty(RiskVocabulary.DEPENDS_ON, firstOccurrence);
    firstOccurrence.addProperty(RiskVocabulary.DEPENDS_ON, secondOccurrence);
    firstPackage.addProperty(RiskVocabulary.AFFECTED_BY, firstVulnerability);
    firstPackage.addProperty(RiskVocabulary.AFFECTED_BY, secondVulnerability);
    secondPackage.addProperty(RiskVocabulary.AFFECTED_BY, firstVulnerability);
    unrelatedPackage.addProperty(RiskVocabulary.AFFECTED_BY, firstVulnerability);
    scopeApplication(model, application, "overview");
  }

  private void populateVulnerabilityGraph(Model model) {
    Resource application = model.createResource("urn:test:vulnerable-app");
    Resource directPackage =
        model.createResource("urn:test:package:alpha")
            .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
            .addProperty(RDFS.label, "alpha")
            .addProperty(RiskVocabulary.VERSION, "1.0")
            .addProperty(RiskVocabulary.PURL, "pkg:npm/alpha@1.0");
    Resource nestedPackage =
        model.createResource("urn:test:package:beta")
            .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
            .addProperty(RDFS.label, "beta");
    Resource directOccurrence = occurrence(model, "urn:test:occurrence:alpha", directPackage);
    Resource nestedOccurrence = occurrence(model, "urn:test:occurrence:beta", nestedPackage);
    application.addProperty(RiskVocabulary.DEPENDS_ON, directOccurrence);
    directOccurrence.addProperty(RiskVocabulary.DEPENDS_ON, nestedOccurrence);

    Resource detailedVulnerability =
        model.createResource("urn:test:vulnerability:detailed")
            .addProperty(RDF.type, RiskVocabulary.VULNERABILITY)
            .addProperty(RiskVocabulary.OSV_ID, "GHSA-DETAILED")
            .addProperty(RiskVocabulary.ALIAS, "CVE-2026-1")
            .addProperty(RiskVocabulary.ALIAS, "GHSA-ALIAS")
            .addProperty(RiskVocabulary.SUMMARY, "Detailed vulnerability")
            .addProperty(RiskVocabulary.DETAILS, "Full details")
            .addProperty(RiskVocabulary.SEVERITY_LEVEL, "HIGH")
            .addProperty(RiskVocabulary.PUBLISHED_AT, "2026-07-18T00:00:00Z")
            .addProperty(RiskVocabulary.MODIFIED_AT, "not-an-instant")
            .addProperty(RiskVocabulary.REFERENCE_URL, "https://example.test/one")
            .addProperty(RiskVocabulary.REFERENCE_URL, "https://example.test/two");
    directPackage.addProperty(RiskVocabulary.AFFECTED_BY, detailedVulnerability);
    addAssessment(model, detailedVulnerability, "one", "3.1", "CVSS:3.1/AV:N/AC:L");
    addAssessment(model, detailedVulnerability, "two", "4.0", "CVSS:4.0/AV:N/AC:H");
    addFixedVersion(model, detailedVulnerability, "2.0");
    addFixedVersion(model, detailedVulnerability, "3.0");

    Resource minimalVulnerability =
        model.createResource("urn:test:vulnerability:minimal")
            .addProperty(RDF.type, RiskVocabulary.VULNERABILITY)
            .addProperty(RiskVocabulary.OSV_ID, "OSV-MINIMAL");
    nestedPackage.addProperty(RiskVocabulary.AFFECTED_BY, minimalVulnerability);
    scopeApplication(model, application, "vulnerable");
  }

  private void populateReferenceGraph(Model model) {
    Resource application = model.createResource("urn:test:reference-app");
    Resource firstVersion = referencePackage(model, "alpha-one", "alpha", "1.0");
    Resource secondVersion = referencePackage(model, "alpha-two", "alpha", "2.0");
    application.addProperty(
        RiskVocabulary.DEPENDS_ON,
        occurrence(model, "urn:test:reference-occurrence:alpha-one", firstVersion));
    application.addProperty(
        RiskVocabulary.DEPENDS_ON,
        occurrence(model, "urn:test:reference-occurrence:alpha-two", secondVersion));

    Resource firstAdvisory =
        model.createResource("urn:test:reference-vulnerability:one")
            .addProperty(RiskVocabulary.OSV_ID, "GHSA-ONE")
            .addProperty(RiskVocabulary.ALIAS, "CVE-2026-1")
            .addProperty(RiskVocabulary.ALIAS, "GHSA-ALIAS")
            .addProperty(RiskVocabulary.SUMMARY, "First advisory")
            .addProperty(
                RiskVocabulary.REFERENCE_URL,
                "https://nvd.nist.gov/vuln/detail/CVE-2026-1")
            .addProperty(
                RiskVocabulary.REFERENCE_URL,
                "https://github.com/example/project/security/advisories/GHSA-ONE");
    firstVersion.addProperty(RiskVocabulary.AFFECTED_BY, firstAdvisory);
    secondVersion.addProperty(RiskVocabulary.AFFECTED_BY, firstAdvisory);

    Resource secondAdvisory =
        model.createResource("urn:test:reference-vulnerability:two")
            .addProperty(RiskVocabulary.OSV_ID, "OSV-TWO")
            .addProperty(RiskVocabulary.REFERENCE_URL, "https://example.test/advisory");
    firstVersion.addProperty(RiskVocabulary.AFFECTED_BY, secondAdvisory);

    Resource unrelatedApplication = model.createResource("urn:test:unrelated-reference-app");
    Resource unrelatedPackage = referencePackage(model, "unrelated", "unrelated", "9.0");
    Resource unrelatedAdvisory =
        model.createResource("urn:test:reference-vulnerability:unrelated")
            .addProperty(RiskVocabulary.OSV_ID, "CVE-UNRELATED")
            .addProperty(RiskVocabulary.REFERENCE_URL, "https://example.test/unrelated");
    unrelatedApplication.addProperty(
        RiskVocabulary.DEPENDS_ON,
        occurrence(model, "urn:test:reference-occurrence:unrelated", unrelatedPackage));
    unrelatedPackage.addProperty(RiskVocabulary.AFFECTED_BY, unrelatedAdvisory);
    scopeApplication(model, application, "reference");
    scopeApplication(model, unrelatedApplication, "unrelated");
  }

  private void scopeApplication(Model model, Resource application, String id) {
    Resource run = model.createResource("urn:test:import:" + id)
        .addProperty(RDF.type, RiskVocabulary.IMPORT_RUN)
        .addLiteral(RiskVocabulary.IMPORT_ID, id);
    Resource root = model.createResource("urn:test:root:" + id)
        .addProperty(RDF.type, RiskVocabulary.APPLICATION_OCCURRENCE)
        .addProperty(RiskVocabulary.BELONGS_TO_IMPORT, run)
        .addProperty(RiskVocabulary.INSTANCE_OF, application);
    application.addProperty(RDF.type, RiskVocabulary.APPLICATION)
        .addProperty(RiskVocabulary.ACTIVE_IMPORT, run);
    run.addProperty(RiskVocabulary.ROOT_OCCURRENCE, root);
    var direct = model.listObjectsOfProperty(application, RiskVocabulary.DEPENDS_ON).toList();
    model.removeAll(application, RiskVocabulary.DEPENDS_ON, null);
    direct.forEach(node -> root.addProperty(RiskVocabulary.DEPENDS_ON, node));
    ArrayDeque<Resource> queue = new ArrayDeque<>();
    direct.stream().filter(RDFNode::isResource).map(RDFNode::asResource).forEach(queue::add);
    java.util.Set<Resource> visited = new java.util.HashSet<>();
    while (!queue.isEmpty()) {
      Resource occurrence = queue.remove();
      if (!visited.add(occurrence)) continue;
      occurrence.addProperty(RiskVocabulary.BELONGS_TO_IMPORT, run);
      model.listObjectsOfProperty(occurrence, RiskVocabulary.DEPENDS_ON).toList().stream()
          .filter(RDFNode::isResource).map(RDFNode::asResource).forEach(queue::add);
    }
  }

  private Resource referencePackage(
      Model model, String iriSuffix, String packageName, String installedVersion) {
    return model.createResource("urn:test:reference-package:" + iriSuffix)
        .addProperty(RDFS.label, packageName)
        .addProperty(RiskVocabulary.VERSION, installedVersion);
  }

  private Resource occurrence(Model model, String iri, Resource packageVersion) {
    return model.createResource(iri)
        .addProperty(RDF.type, RiskVocabulary.COMPONENT_OCCURRENCE)
        .addProperty(RiskVocabulary.INSTANCE_OF, packageVersion);
  }

  private void addAssessment(
      Model model, Resource vulnerability, String suffix, String version, String vector) {
    Resource assessment =
        model.createResource("urn:test:assessment:" + suffix)
            .addProperty(RDF.type, RiskVocabulary.CVSS_ASSESSMENT)
            .addProperty(RiskVocabulary.CVSS_TYPE, "CVSS_V3")
            .addProperty(RiskVocabulary.CVSS_VERSION, version)
            .addProperty(RiskVocabulary.VECTOR, vector);
    vulnerability.addProperty(RiskVocabulary.HAS_SEVERITY, assessment);
  }

  private void addFixedVersion(Model model, Resource vulnerability, String version) {
    Resource fixedPackage =
        model.createResource("urn:test:fixed:" + version)
            .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
            .addProperty(RDFS.label, "alpha")
            .addProperty(RiskVocabulary.VERSION, version)
            .addProperty(RiskVocabulary.PURL, "pkg:npm/alpha@" + version);
    vulnerability.addProperty(RiskVocabulary.FIXED_IN, fixedPackage);
  }

  private ExplorerService service(Dataset dataset) {
    return new ExplorerService(new JenaGraphRepository(dataset, new ObjectMapper()));
  }
}
