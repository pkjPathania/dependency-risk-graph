package io.github.pkjpathania.dependencyrisk.workbench.graphql.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.ApplicationOccurrence;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.DrgBaseEntity;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.PackageOccurrence;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.Vulnerability;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class GraphQlTraversalServiceTest {
  private static final String FIRST_APPLICATION = "urn:test:application:first";
  private static final String SECOND_APPLICATION = "urn:test:application:second";
  private static final String DIRECT_PACKAGE = "urn:test:package:direct";
  private static final String TRANSITIVE_PACKAGE = "urn:test:package:transitive";
  private static final String VULNERABILITY = "urn:test:vulnerability:one";
  private static final String FIXED_PACKAGE = "urn:test:package:direct:fixed:1.1";

  private ApplicationOccurrenceService applicationService;
  private PackageOccurrenceService packageService;
  private VulnerabilityGraphQlService vulnerabilityService;
  private CountingJenaGraphRepository repository;

  @BeforeEach
  void setUp() {
    Dataset dataset = DatasetFactory.createTxnMem();
    dataset.executeWrite(() -> populate(dataset.getDefaultModel()));
    repository = new CountingJenaGraphRepository(dataset);
    applicationService = new ApplicationOccurrenceService(repository);
    packageService = new PackageOccurrenceService(repository);
    vulnerabilityService = new VulnerabilityGraphQlService(repository);
  }

  @Test
  void traversesFromApplicationToDirectAndTransitivePackages() {
    List<PackageOccurrence> packages = packageService.findByApplication(FIRST_APPLICATION);

    assertEquals(List.of(DIRECT_PACKAGE, TRANSITIVE_PACKAGE), ids(packages));
    assertEquals("pkg:maven/example/direct@1.0", packages.getFirst().getPurl());
  }

  @Test
  void traversesFromPackageBackToEveryApplication() {
    List<ApplicationOccurrence> applications =
        applicationService.findByPackage(DIRECT_PACKAGE);

    assertEquals(List.of(FIRST_APPLICATION, SECOND_APPLICATION), ids(applications));
  }

  @Test
  void mapsVulnerabilityAndAggregatesAllOsvAliases() {
    List<Vulnerability> vulnerabilities = vulnerabilityService.findByPackage(DIRECT_PACKAGE);

    assertEquals(1, vulnerabilities.size());
    Vulnerability vulnerability = vulnerabilities.getFirst();
    assertEquals(VULNERABILITY, vulnerability.getId());
    assertEquals("GHSA-TEST", vulnerability.getOsv().getOsvId());
    assertEquals(List.of("CVE-2026-1", "GHSA-ALIAS"), vulnerability.getOsv().getAliases());
    assertEquals("Example OSV advisory", vulnerability.getOsv().getSummary());
    assertEquals("2026-07-20T10:15:30Z", vulnerability.getOsv().getPublishedAt());
    assertEquals(1, vulnerability.getFixedVersions().size());
    assertEquals("1.1", vulnerability.getFixedVersions().getFirst().getVersion());
    assertEquals(
        "pkg:maven/example/direct@1.1", vulnerability.getFixedVersions().getFirst().getPurl());
    assertTrue(vulnerabilityService.findById(VULNERABILITY).isPresent());
  }

  @Test
  void traversesFromVulnerabilityBackToAffectedPackages() {
    assertEquals(
        List.of(DIRECT_PACKAGE), ids(packageService.findByVulnerability(VULNERABILITY)));
  }

  @Test
  void traversesDirectlyBetweenApplicationsAndVulnerabilities() {
    assertEquals(
        List.of(VULNERABILITY), ids(vulnerabilityService.findByApplication(FIRST_APPLICATION)));
    assertEquals(
        List.of(FIRST_APPLICATION, SECOND_APPLICATION),
        ids(applicationService.findByVulnerability(VULNERABILITY)));
  }

  @Test
  void loadsPackagesForMultipleApplicationsWithOneSelect() {
    repository.resetSelectCount();

    Map<String, List<PackageOccurrence>> packages =
        packageService.findByApplications(List.of(FIRST_APPLICATION, SECOND_APPLICATION));

    assertEquals(1, repository.selectCount());
    assertEquals(List.of(DIRECT_PACKAGE, TRANSITIVE_PACKAGE), ids(packages.get(FIRST_APPLICATION)));
    assertEquals(
        List.of(DIRECT_PACKAGE, TRANSITIVE_PACKAGE), ids(packages.get(SECOND_APPLICATION)));
  }

  @Test
  void loadsApplicationsForMultiplePackagesWithOneSelect() {
    repository.resetSelectCount();

    Map<String, List<ApplicationOccurrence>> applications =
        applicationService.findByPackages(List.of(DIRECT_PACKAGE, TRANSITIVE_PACKAGE));

    assertEquals(1, repository.selectCount());
    assertEquals(
        List.of(FIRST_APPLICATION, SECOND_APPLICATION), ids(applications.get(DIRECT_PACKAGE)));
    assertEquals(
        List.of(FIRST_APPLICATION, SECOND_APPLICATION), ids(applications.get(TRANSITIVE_PACKAGE)));
  }

  @Test
  void loadsVulnerabilitiesForMultiplePackagesWithOneSelect() {
    repository.resetSelectCount();

    Map<String, List<Vulnerability>> vulnerabilities =
        vulnerabilityService.findByPackages(List.of(DIRECT_PACKAGE, TRANSITIVE_PACKAGE));

    assertEquals(1, repository.selectCount());
    assertEquals(List.of(VULNERABILITY), ids(vulnerabilities.get(DIRECT_PACKAGE)));
    assertEquals(List.of(), vulnerabilities.get(TRANSITIVE_PACKAGE));
  }

  @Test
  void loadsDistinctVulnerabilitiesForMultipleApplicationsWithOneSelect() {
    repository.resetSelectCount();

    Map<String, List<Vulnerability>> vulnerabilities =
        vulnerabilityService.findByApplications(
            List.of(FIRST_APPLICATION, SECOND_APPLICATION, "urn:test:application:missing"));

    assertEquals(1, repository.selectCount());
    assertEquals(List.of(VULNERABILITY), ids(vulnerabilities.get(FIRST_APPLICATION)));
    assertEquals(List.of(VULNERABILITY), ids(vulnerabilities.get(SECOND_APPLICATION)));
    assertEquals(List.of(), vulnerabilities.get("urn:test:application:missing"));
  }

  @Test
  void loadsDistinctApplicationsForMultipleVulnerabilitiesWithOneSelect() {
    repository.resetSelectCount();

    Map<String, List<ApplicationOccurrence>> applications =
        applicationService.findByVulnerabilities(
            List.of(VULNERABILITY, "urn:test:vulnerability:missing"));

    assertEquals(1, repository.selectCount());
    assertEquals(
        List.of(FIRST_APPLICATION, SECOND_APPLICATION), ids(applications.get(VULNERABILITY)));
    assertEquals(List.of(), applications.get("urn:test:vulnerability:missing"));
  }

  @Test
  void loadsPackagesForMultipleVulnerabilitiesWithOneSelect() {
    repository.resetSelectCount();

    Map<String, List<PackageOccurrence>> packages =
        packageService.findByVulnerabilities(
            List.of(VULNERABILITY, "urn:test:vulnerability:missing"));

    assertEquals(1, repository.selectCount());
    assertEquals(List.of(DIRECT_PACKAGE), ids(packages.get(VULNERABILITY)));
    assertEquals(List.of(), packages.get("urn:test:vulnerability:missing"));
  }

  private static List<String> ids(List<? extends DrgBaseEntity> entities) {
    return entities.stream().map(DrgBaseEntity::getId).toList();
  }

  private void populate(Model model) {
    Resource firstApplication =
        model
            .createResource(FIRST_APPLICATION)
            .addProperty(RDF.type, RiskVocabulary.APPLICATION_OCCURRENCE)
            .addProperty(RiskVocabulary.NAME, "First application");
    Resource secondApplication =
        model
            .createResource(SECOND_APPLICATION)
            .addProperty(RDF.type, RiskVocabulary.APPLICATION_OCCURRENCE)
            .addProperty(RiskVocabulary.NAME, "Second application");
    Resource directPackage =
        model
            .createResource(DIRECT_PACKAGE)
            .addProperty(RDF.type, RiskVocabulary.PACKAGE_OCCURRENCE)
            .addProperty(RiskVocabulary.NAME, "direct")
            .addProperty(RiskVocabulary.VERSION, "1.0")
            .addProperty(RiskVocabulary.PURL, "pkg:maven/example/direct@1.0");
    Resource transitivePackage =
        model
            .createResource(TRANSITIVE_PACKAGE)
            .addProperty(RDF.type, RiskVocabulary.PACKAGE_OCCURRENCE)
            .addProperty(RiskVocabulary.NAME, "transitive");
    Resource vulnerability =
        model
            .createResource(VULNERABILITY)
            .addProperty(RDF.type, RiskVocabulary.VULNERABILITY)
            .addProperty(RiskVocabulary.OSV_ID, "GHSA-TEST")
            .addProperty(RiskVocabulary.ALIAS, "CVE-2026-1")
            .addProperty(RiskVocabulary.ALIAS, "GHSA-ALIAS")
            .addProperty(RiskVocabulary.SUMMARY, "Example OSV advisory")
            .addProperty(RiskVocabulary.DETAILS, "Advisory details")
            .addProperty(RiskVocabulary.PUBLISHED_AT, "2026-07-20T10:15:30Z");
    Resource fixedPackage =
        model
            .createResource(FIXED_PACKAGE)
            .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
            .addProperty(RiskVocabulary.VERSION, "1.1")
            .addProperty(RiskVocabulary.PURL, "pkg:maven/example/direct@1.1");

    firstApplication.addProperty(RiskVocabulary.DEPENDS_ON, directPackage);
    directPackage.addProperty(RiskVocabulary.DEPENDS_ON, transitivePackage);
    secondApplication.addProperty(RiskVocabulary.DEPENDS_ON, directPackage);
    directPackage.addProperty(RiskVocabulary.AFFECTED_BY, vulnerability);
    vulnerability.addProperty(RiskVocabulary.FIXED_IN, fixedPackage);
  }

  private static final class CountingJenaGraphRepository extends JenaGraphRepository {
    private int selectCount;

    private CountingJenaGraphRepository(Dataset dataset) {
      super(dataset, new ObjectMapper());
    }

    @Override
    public <T> List<T> execSelect(String sparql, Function<QuerySolution, T> mapper) {
      selectCount++;
      return super.execSelect(sparql, mapper);
    }

    private int selectCount() {
      return selectCount;
    }

    private void resetSelectCount() {
      selectCount = 0;
    }
  }
}
