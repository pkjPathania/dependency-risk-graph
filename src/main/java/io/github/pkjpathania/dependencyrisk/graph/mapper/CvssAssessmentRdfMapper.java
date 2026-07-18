package io.github.pkjpathania.dependencyrisk.graph.mapper;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvSeverity;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvVulnerabilityResponse;
import io.github.pkjpathania.dependencyrisk.vulnerability.iri.RiskResourceIriFactory;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;

public final class CvssAssessmentRdfMapper {

  private CvssAssessmentRdfMapper() {}

  public static void map(
      Model model, Resource vulnerabilityResource, OsvVulnerabilityResponse vulnerability) {

    model.removeAll(vulnerabilityResource, RiskVocabulary.HAS_SEVERITY, null);

    for (OsvSeverity severity : vulnerability.severity()) {
      if (severity == null || StringUtils.isBlank(severity.score())) {
        continue;
      }

      String vector = severity.score().trim();
      String type = StringUtils.trimToEmpty(severity.type());

      Resource assessment =
          model.createResource(
              RiskResourceIriFactory.cvssAssessment(vulnerability.id(), type, vector));

      model.add(vulnerabilityResource, RiskVocabulary.HAS_SEVERITY, assessment);

      model.add(assessment, RDF.type, RiskVocabulary.CVSS_ASSESSMENT);

      RdfValueWriter.replaceLiteral(model, assessment, RiskVocabulary.CVSS_TYPE, type);

      RdfValueWriter.replaceLiteral(
          model, assessment, RiskVocabulary.CVSS_VERSION, extractVersion(vector));

      RdfValueWriter.replaceLiteral(model, assessment, RiskVocabulary.VECTOR, vector);

      RdfValueWriter.replaceLiteral(model, assessment, RiskVocabulary.SOURCE, "OSV");
    }
  }

  private static String extractVersion(String vector) {
    if (vector.startsWith("CVSS:4.0/")) {
      return "4.0";
    }
    if (vector.startsWith("CVSS:3.1/")) {
      return "3.1";
    }
    if (vector.startsWith("CVSS:3.0/")) {
      return "3.0";
    }
    return null;
  }
}
