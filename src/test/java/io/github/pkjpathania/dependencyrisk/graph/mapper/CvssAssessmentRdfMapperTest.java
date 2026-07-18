package io.github.pkjpathania.dependencyrisk.graph.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvSeverity;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvVulnerabilityResponse;
import io.github.pkjpathania.dependencyrisk.vulnerability.iri.RiskResourceIriFactory;
import java.util.List;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.junit.jupiter.api.Test;

class CvssAssessmentRdfMapperTest {

  @Test
  void mapsAllUsableSeverityEntriesAndReplacesOldLinks() {
    Model model = ModelFactory.createDefaultModel();
    Resource vulnerability = model.createResource("urn:test:vulnerability");
    Resource oldAssessment = model.createResource("urn:test:old-assessment");
    model.add(vulnerability, RiskVocabulary.HAS_SEVERITY, oldAssessment);
    OsvVulnerabilityResponse advisory =
        vulnerability(
            List.of(
                new OsvSeverity("CVSS_V3", "CVSS:3.1/AV:N/AC:L"),
                new OsvSeverity("CVSS_V4", "CVSS:4.0/AV:N/AC:H"),
                new OsvSeverity("CVSS_V3", "  ")));

    CvssAssessmentRdfMapper.map(model, vulnerability, advisory);

    assertFalse(model.contains(vulnerability, RiskVocabulary.HAS_SEVERITY, oldAssessment));
    assertEquals(
        2, model.listObjectsOfProperty(vulnerability, RiskVocabulary.HAS_SEVERITY).toList().size());
    Resource v3 =
        model.getResource(
            RiskResourceIriFactory.cvssAssessment(
                advisory.id(), "CVSS_V3", "CVSS:3.1/AV:N/AC:L"));
    Resource v4 =
        model.getResource(
            RiskResourceIriFactory.cvssAssessment(
                advisory.id(), "CVSS_V4", "CVSS:4.0/AV:N/AC:H"));
    assertTrue(model.contains(v3, RiskVocabulary.CVSS_VERSION, "3.1"));
    assertTrue(model.contains(v4, RiskVocabulary.CVSS_VERSION, "4.0"));
  }

  private OsvVulnerabilityResponse vulnerability(List<OsvSeverity> severity) {
    return new OsvVulnerabilityResponse(
        "GHSA-1234",
        "summary",
        "details",
        List.of(),
        null,
        null,
        null,
        List.of(),
        List.of(),
        null,
        List.of(),
        List.of(),
        null,
        severity);
  }
}
