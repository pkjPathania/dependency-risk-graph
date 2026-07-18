package io.github.pkjpathania.dependencyrisk.graph.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvAffected;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvPackageResponse;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvRange;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvRangeEvent;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvVulnerabilityResponse;
import io.github.pkjpathania.dependencyrisk.vulnerability.iri.RiskResourceIriFactory;
import io.github.pkjpathania.dependencyrisk.vulnerability.model.PackageScanTarget;
import java.util.List;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.junit.jupiter.api.Test;

class FixedVersionRdfMapperTest {

  @Test
  void mapsDistinctFixesOnlyForTheCurrentPackageAndReplacesOldLinks() {
    Model model = ModelFactory.createDefaultModel();
    Resource vulnerabilityResource = model.createResource("urn:test:vulnerability");
    Resource oldFix = model.createResource("urn:test:old-fix");
    model.add(vulnerabilityResource, RiskVocabulary.FIXED_IN, oldFix);
    PackageScanTarget target =
        new PackageScanTarget(
            "urn:test:libthrift",
            "libthrift",
            "0.22.0",
            "pkg:maven/org.apache.thrift/libthrift@0.22.0?type=jar#runtime");
    OsvAffected matching =
        affected(
            "libthrift",
            "pkg:maven/org.apache.thrift/libthrift@0.21.0?other=value",
            "0.23.0",
            "0.23.0");
    OsvAffected unrelated =
        affected("other", "pkg:maven/example/other@0.22.0", "9.9.9");

    FixedVersionRdfMapper.map(
        model, vulnerabilityResource, target, vulnerability(List.of(matching, unrelated)));

    assertFalse(model.contains(vulnerabilityResource, RiskVocabulary.FIXED_IN, oldFix));
    assertEquals(
        1, model.listObjectsOfProperty(vulnerabilityResource, RiskVocabulary.FIXED_IN).toList().size());
    Resource fixed =
        model.getResource(RiskResourceIriFactory.fixedPackageVersion("libthrift", "0.23.0"));
    assertTrue(model.contains(fixed, RDF.type, RiskVocabulary.PACKAGE_VERSION));
    assertTrue(model.contains(fixed, RDFS.label, "libthrift"));
    assertTrue(model.contains(fixed, RiskVocabulary.VERSION, "0.23.0"));
    assertTrue(
        model.contains(
            fixed,
            RiskVocabulary.PURL,
            "pkg:maven/org.apache.thrift/libthrift@0.23.0?type=jar#runtime"));
  }

  @Test
  void fallsBackToCaseInsensitiveNameWhenAffectedPurlIsMissing() {
    Model model = ModelFactory.createDefaultModel();
    Resource vulnerabilityResource = model.createResource("urn:test:vulnerability");
    PackageScanTarget target =
        new PackageScanTarget("urn:test:package", "Library", "1.0", "pkg:npm/library@1.0");

    FixedVersionRdfMapper.map(
        model,
        vulnerabilityResource,
        target,
        vulnerability(List.of(affected("library", null, "2.0"))));

    assertEquals(
        1, model.listObjectsOfProperty(vulnerabilityResource, RiskVocabulary.FIXED_IN).toList().size());
  }

  private OsvAffected affected(String name, String purl, String... fixedVersions) {
    List<OsvRangeEvent> events =
        java.util.Arrays.stream(fixedVersions)
            .map(version -> new OsvRangeEvent(null, version, null, null))
            .toList();
    return new OsvAffected(
        new OsvPackageResponse(name, "Maven", purl),
        List.of(new OsvRange("ECOSYSTEM", null, events)),
        List.of(),
        null);
  }

  private OsvVulnerabilityResponse vulnerability(List<OsvAffected> affected) {
    return new OsvVulnerabilityResponse(
        "GHSA-1234",
        null,
        null,
        List.of(),
        null,
        null,
        null,
        List.of(),
        List.of(),
        null,
        List.of(),
        affected,
        null,
        List.of());
  }
}
