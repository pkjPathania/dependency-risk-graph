package io.github.pkjpathania.dependencyrisk.workbench.evidence.jena;

import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceSource;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceSourceRepository;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AffectedPackageEvidenceSource;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.RDFNode;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JenaAdvisoryEvidenceSourceRepository implements AdvisoryEvidenceSourceRepository {

  private static final String FIND_BY_IDENTIFIER_QUERY =
      """
      PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

      SELECT DISTINCT
        ?vulnerability
        ?osvId
        ?alias
        ?summary
        ?details
        ?affectedPackage
        ?packageName
        ?packagePurl
        ?ecosystem
        ?sourceUrl
      WHERE {
        VALUES ?lookupIdentifier {
          ?identifier
        }

        ?vulnerability
            rdf:type risk:Vulnerability ;
            risk:osvId ?osvId .

        {
          FILTER(?osvId = ?lookupIdentifier)
        }
        UNION
        {
          ?vulnerability risk:alias ?lookupIdentifier .
        }

        OPTIONAL {
          ?vulnerability risk:alias ?alias .
        }

        OPTIONAL {
          ?vulnerability risk:summary ?summary .
        }

        OPTIONAL {
          ?vulnerability risk:details ?details .
        }

        OPTIONAL {
          ?vulnerability risk:hasAffectedPackage ?affectedPackage .

          OPTIONAL {
            ?affectedPackage
                risk:affectedPackageName ?packageName .
          }

          OPTIONAL {
            ?affectedPackage
                risk:affectedPackagePurl ?packagePurl .
          }

          OPTIONAL {
            ?affectedPackage
                risk:ecosystem ?ecosystem .
          }

          OPTIONAL {
            ?affectedPackage
                risk:sourceUrl ?sourceUrl .
          }
        }
      }
      ORDER BY ?affectedPackage ?alias
      """;

  private final JenaGraphRepository repository;

  @Override
  public Optional<AdvisoryEvidenceSource> findByIdentifier(String identifier) {

    String normalizedIdentifier = StringUtils.trimToNull(identifier);

    if (normalizedIdentifier == null) {
      throw new IllegalArgumentException("Vulnerability identifier is missing");
    }

    ParameterizedSparqlString sparql = new ParameterizedSparqlString(FIND_BY_IDENTIFIER_QUERY);

    sparql.setLiteral("identifier", normalizedIdentifier);

    List<AdvisoryEvidenceRow> rows = execSelect(repository.dataset(), sparql.toString());

    return toSource(rows);
  }

  private List<AdvisoryEvidenceRow> execSelect(Dataset dataset, String query) {

    return dataset.calculateRead(
        () -> {
          List<AdvisoryEvidenceRow> rows = new ArrayList<>();

          try (QueryExecution queryExecution = QueryExecutionFactory.create(query, dataset)) {

            ResultSet resultSet = queryExecution.execSelect();

            while (resultSet.hasNext()) {
              rows.add(toRow(resultSet.nextSolution()));
            }
          }

          return List.copyOf(rows);
        });
  }

  private AdvisoryEvidenceRow toRow(QuerySolution solution) {

    return new AdvisoryEvidenceRow(
        iriValue(solution, "vulnerability"),
        literalValue(solution, "osvId"),
        literalValue(solution, "alias"),
        literalValue(solution, "summary"),
        literalValue(solution, "details"),
        iriValue(solution, "affectedPackage"),
        literalValue(solution, "packageName"),
        literalValue(solution, "packagePurl"),
        literalValue(solution, "ecosystem"),
        literalValue(solution, "sourceUrl"));
  }

  private Optional<AdvisoryEvidenceSource> toSource(List<AdvisoryEvidenceRow> rows) {

    if (rows.isEmpty()) {
      return Optional.empty();
    }

    validateSingleVulnerability(rows);

    String vulnerabilityIri =
        requireValue(
            firstNonBlank(rows, AdvisoryEvidenceRow::vulnerabilityIri), "vulnerability IRI");

    String vulnerabilityId =
        requireValue(firstNonBlank(rows, AdvisoryEvidenceRow::vulnerabilityId), "vulnerability ID");

    String summary = firstNonBlank(rows, AdvisoryEvidenceRow::summary);

    String details = firstNonBlank(rows, AdvisoryEvidenceRow::details);

    List<String> aliases =
        rows.stream()
            .map(AdvisoryEvidenceRow::alias)
            .map(StringUtils::trimToNull)
            .filter(value -> value != null)
            .distinct()
            .sorted()
            .toList();

    Map<String, AffectedPackageEvidenceSource> affectedPackagesByIri = new LinkedHashMap<>();

    for (AdvisoryEvidenceRow row : rows) {
      String affectedPackageIri = StringUtils.trimToNull(row.affectedPackageIri());

      if (affectedPackageIri == null) {
        continue;
      }

      affectedPackagesByIri.putIfAbsent(
          affectedPackageIri,
          new AffectedPackageEvidenceSource(
              affectedPackageIri,
              StringUtils.trimToNull(row.packageName()),
              StringUtils.trimToNull(row.packagePurl()),
              StringUtils.trimToNull(row.ecosystem()),
              StringUtils.trimToNull(row.sourceUrl())));
    }

    AdvisoryEvidenceSource source =
        new AdvisoryEvidenceSource(
            vulnerabilityIri,
            vulnerabilityId,
            aliases,
            summary,
            details,
            List.copyOf(affectedPackagesByIri.values()));

    return Optional.of(source);
  }

  private void validateSingleVulnerability(List<AdvisoryEvidenceRow> rows) {

    List<String> vulnerabilityIris =
        rows.stream()
            .map(AdvisoryEvidenceRow::vulnerabilityIri)
            .map(StringUtils::trimToNull)
            .filter(value -> value != null)
            .distinct()
            .limit(2)
            .toList();

    if (vulnerabilityIris.isEmpty()) {
      throw new IllegalStateException("SPARQL result is missing the vulnerability IRI");
    }

    if (vulnerabilityIris.size() > 1) {
      throw new IllegalStateException(
          "Identifier resolved to multiple vulnerabilities: " + vulnerabilityIris);
    }
  }

  private String firstNonBlank(
      List<AdvisoryEvidenceRow> rows, Function<AdvisoryEvidenceRow, String> extractor) {

    return rows.stream()
        .map(extractor)
        .map(StringUtils::trimToNull)
        .filter(value -> value != null)
        .findFirst()
        .orElse(null);
  }

  private String requireValue(String value, String fieldName) {

    if (value == null) {
      throw new IllegalStateException("SPARQL result is missing required " + fieldName);
    }

    return value;
  }

  private String iriValue(QuerySolution solution, String variable) {

    RDFNode node = solution.get(variable);

    if (node == null || !node.isURIResource()) {
      return null;
    }

    return node.asResource().getURI();
  }

  private String literalValue(QuerySolution solution, String variable) {

    RDFNode node = solution.get(variable);

    if (node == null) {
      return null;
    }

    if (node.isLiteral()) {
      return StringUtils.trimToNull(node.asLiteral().getString());
    }

    if (node.isURIResource()) {
      return StringUtils.trimToNull(node.asResource().getURI());
    }

    return StringUtils.trimToNull(node.toString());
  }

  private record AdvisoryEvidenceRow(
      String vulnerabilityIri,
      String vulnerabilityId,
      String alias,
      String summary,
      String details,
      String affectedPackageIri,
      String packageName,
      String packagePurl,
      String ecosystem,
      String sourceUrl) {}
}
