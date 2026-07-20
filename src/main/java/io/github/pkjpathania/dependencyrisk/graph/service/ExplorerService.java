package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.AdvisoryReferenceItem;
import io.github.pkjpathania.dependencyrisk.graph.model.AffectedPackageReference;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationOverview;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationReferencesResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationVulnerabilitiesResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationVulnerabilityItem;
import io.github.pkjpathania.dependencyrisk.graph.model.CvssAssessmentView;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencySummary;
import io.github.pkjpathania.dependencyrisk.graph.model.FixedVersionView;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import java.net.URI;
import java.time.DateTimeException;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QuerySolution;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExplorerService {

  private static final String PREFIXES =
      """
      PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>
      PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      """;
  private static final Comparator<AdvisoryReferenceItem> ADVISORY_COMPARATOR =
      Comparator.comparing(ExplorerService::preferredIdentifier, String.CASE_INSENSITIVE_ORDER)
          .thenComparing(
              item -> StringUtils.defaultString(item.osvId()), String.CASE_INSENSITIVE_ORDER);
  private static final Comparator<AffectedPackageReference> AFFECTED_PACKAGE_COMPARATOR =
      Comparator.comparing(
              AffectedPackageReference::packageName,
              Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
          .thenComparing(
              AffectedPackageReference::installedVersion,
              Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
  private static final Comparator<String> REFERENCE_COMPARATOR =
      Comparator.comparingInt(ExplorerService::referencePriority)
          .thenComparing(String.CASE_INSENSITIVE_ORDER);
  private static final String APPLICATION_VULNERABILITIES_QUERY =
      """
      SELECT
          ?package ?packageName ?installedVersion ?installedPurl ?dependencyType
          ?vulnerability ?osvId ?alias ?summary ?details ?severityLevel
          ?publishedAt ?modifiedAt ?assessment ?cvssType ?cvssVersion ?vector
          ?fixedPackage ?fixedPackageName ?fixedVersion ?fixedPurl ?referenceUrl
      WHERE {
          VALUES ?application { ?applicationValue }

          ?application risk:activeImport ?importRun .
          ?importRun risk:rootOccurrence ?root .
          ?root risk:belongsToImport ?importRun ; risk:dependsOn+ ?occurrence .
          ?occurrence risk:belongsToImport ?importRun ; risk:instanceOf ?package .
          ?package a risk:PackageVersion ;
                   rdfs:label ?packageName ;
                   risk:affectedBy ?vulnerability .

          OPTIONAL { ?package risk:version ?installedVersion . }
          OPTIONAL { ?package risk:purl ?installedPurl . }

          BIND(
              IF(EXISTS { ?root risk:dependsOn ?occurrence }, "DIRECT", "TRANSITIVE")
              AS ?dependencyType
          )

          ?vulnerability a risk:Vulnerability ; risk:osvId ?osvId .
          OPTIONAL { ?vulnerability risk:alias ?alias . }
          OPTIONAL { ?vulnerability risk:summary ?summary . }
          OPTIONAL { ?vulnerability risk:details ?details . }
          OPTIONAL { ?vulnerability risk:severityLevel ?severityLevel . }
          OPTIONAL { ?vulnerability risk:publishedAt ?publishedAt . }
          OPTIONAL { ?vulnerability risk:modifiedAt ?modifiedAt . }

          OPTIONAL {
              ?vulnerability risk:hasSeverity ?assessment .
              ?assessment a risk:CvssAssessment ; risk:vector ?vector .
              OPTIONAL { ?assessment risk:cvssType ?cvssType . }
              OPTIONAL { ?assessment risk:cvssVersion ?cvssVersion . }
          }

          OPTIONAL {
              ?vulnerability risk:fixedIn ?fixedPackage .
              ?fixedPackage a risk:PackageVersion ; risk:version ?fixedVersion .
              OPTIONAL { ?fixedPackage rdfs:label ?fixedPackageName . }
              OPTIONAL { ?fixedPackage risk:purl ?fixedPurl . }
          }

          OPTIONAL { ?vulnerability risk:referenceUrl ?referenceUrl . }
      }
      ORDER BY LCASE(STR(?packageName)) LCASE(STR(?osvId))
      """;
  private static final String APPLICATION_REFERENCES_QUERY =
      """
      SELECT DISTINCT
          ?package ?packageName ?installedVersion ?vulnerability
          ?osvId ?alias ?summary ?referenceUrl
      WHERE {
          VALUES ?application { ?applicationValue }

          ?application risk:activeImport ?importRun .
          ?importRun risk:rootOccurrence ?root .
          ?root risk:belongsToImport ?importRun ; risk:dependsOn+ ?occurrence .
          ?occurrence risk:belongsToImport ?importRun ; risk:instanceOf ?package .
          ?package rdfs:label ?packageName ;
                   risk:version ?installedVersion ;
                   risk:affectedBy ?vulnerability .

          ?vulnerability risk:osvId ?osvId ;
                         risk:referenceUrl ?referenceUrl .

          OPTIONAL { ?vulnerability risk:alias ?alias . }
          OPTIONAL { ?vulnerability risk:summary ?summary . }
      }
      ORDER BY
          LCASE(STR(?osvId))
          LCASE(STR(?packageName))
          STR(?installedVersion)
          STR(?referenceUrl)
      """;
  private final JenaGraphRepository repository;

  private static void accumulateVulnerability(
      Map<String, VulnerabilityAccumulator> accumulators, QuerySolution solution) {
    String packageIri = resourceIri(solution, "package");
    String vulnerabilityIri = resourceIri(solution, "vulnerability");
    if (packageIri == null || vulnerabilityIri == null) {
      return;
    }

    String key = packageIri + "\u0000" + vulnerabilityIri;
    VulnerabilityAccumulator accumulator =
        accumulators.computeIfAbsent(key, ignored -> new VulnerabilityAccumulator());
    accumulator.packageIri = packageIri;
    accumulator.vulnerabilityIri = vulnerabilityIri;
    accumulator.packageName =
        firstPresent(accumulator.packageName, stringValue(solution, "packageName"));
    accumulator.installedVersion =
        firstPresent(accumulator.installedVersion, stringValue(solution, "installedVersion"));
    accumulator.installedPurl =
        firstPresent(accumulator.installedPurl, stringValue(solution, "installedPurl"));
    accumulator.dependencyType =
        firstPresent(accumulator.dependencyType, stringValue(solution, "dependencyType"));
    accumulator.osvId = firstPresent(accumulator.osvId, stringValue(solution, "osvId"));
    accumulator.summary = firstPresent(accumulator.summary, stringValue(solution, "summary"));
    accumulator.details = firstPresent(accumulator.details, stringValue(solution, "details"));
    accumulator.severityLevel =
        firstPresent(accumulator.severityLevel, stringValue(solution, "severityLevel"));
    accumulator.publishedAt =
        firstPresent(accumulator.publishedAt, instantValue(solution, "publishedAt"));
    accumulator.modifiedAt =
        firstPresent(accumulator.modifiedAt, instantValue(solution, "modifiedAt"));

    addNonBlank(accumulator.aliases, stringValue(solution, "alias"));
    addNonBlank(accumulator.referenceUrls, stringValue(solution, "referenceUrl"));

    String vector = stringValue(solution, "vector");
    if (StringUtils.isNotBlank(vector)) {
      accumulator.cvssAssessments.add(
          new CvssAssessmentView(
              resourceIri(solution, "assessment"),
              trimmedOrNull(stringValue(solution, "cvssType")),
              trimmedOrNull(stringValue(solution, "cvssVersion")),
              vector.trim()));
    }

    String fixedVersion = stringValue(solution, "fixedVersion");
    if (StringUtils.isNotBlank(fixedVersion)) {
      accumulator.fixedVersions.add(
          new FixedVersionView(
              resourceIri(solution, "fixedPackage"),
              trimmedOrNull(stringValue(solution, "fixedPackageName")),
              fixedVersion.trim(),
              trimmedOrNull(stringValue(solution, "fixedPurl"))));
    }
  }

  private static void accumulateReference(
      Map<String, AdvisoryReferenceAccumulator> grouped, QuerySolution solution) {
    String vulnerabilityIri = resourceIri(solution, "vulnerability");
    String osvId = literalValue(solution, "osvId");
    String key = StringUtils.isNotBlank(vulnerabilityIri) ? vulnerabilityIri : osvId;
    if (StringUtils.isBlank(key)) {
      return;
    }

    AdvisoryReferenceAccumulator accumulator =
        grouped.computeIfAbsent(key, ignored -> new AdvisoryReferenceAccumulator());
    accumulator.vulnerabilityIri = firstPresent(accumulator.vulnerabilityIri, vulnerabilityIri);
    accumulator.osvId = firstPresent(accumulator.osvId, trimmedOrNull(osvId));
    accumulator.summary =
        firstPresent(accumulator.summary, trimmedOrNull(literalValue(solution, "summary")));
    addNonBlank(accumulator.aliases, literalValue(solution, "alias"));
    addNonBlank(accumulator.referenceUrls, literalValue(solution, "referenceUrl"));

    String packageIri = resourceIri(solution, "package");
    String packageName = literalValue(solution, "packageName");
    String installedVersion = literalValue(solution, "installedVersion");
    if (StringUtils.isNotBlank(packageIri)
        && StringUtils.isNotBlank(packageName)
        && StringUtils.isNotBlank(installedVersion)) {
      accumulator.affectedPackages.add(
          new AffectedPackageReference(packageIri, packageName.trim(), installedVersion.trim()));
    }
  }

  private static String stringValue(QuerySolution solution, String variable) {
    if (!solution.contains(variable) || solution.get(variable) == null) {
      return null;
    }
    return solution.get(variable).isLiteral()
        ? solution.getLiteral(variable).getString()
        : solution.get(variable).toString();
  }

  private static String resourceIri(QuerySolution solution, String variable) {
    if (!solution.contains(variable) || !solution.get(variable).isResource()) {
      return null;
    }
    return solution.getResource(variable).getURI();
  }

  private static String literalValue(QuerySolution solution, String variable) {
    if (!solution.contains(variable)
        || solution.get(variable) == null
        || !solution.get(variable).isLiteral()) {
      return null;
    }
    return solution.getLiteral(variable).getString();
  }

  private static Instant instantValue(QuerySolution solution, String variable) {
    String value = stringValue(solution, variable);
    if (StringUtils.isBlank(value)) {
      return null;
    }
    try {
      return Instant.parse(value.trim());
    } catch (DateTimeException ignored) {
      return null;
    }
  }

  private static String trimmedOrNull(String value) {
    return StringUtils.isBlank(value) ? null : value.trim();
  }

  private static void addNonBlank(Set<String> values, String value) {
    if (StringUtils.isNotBlank(value)) {
      values.add(value.trim());
    }
  }

  private static <T> T firstPresent(T current, T candidate) {
    return current != null ? current : candidate;
  }

  private static String preferredIdentifier(AdvisoryReferenceItem item) {
    return item.aliases().stream()
        .filter(alias -> alias.regionMatches(true, 0, "CVE-", 0, 4))
        .findFirst()
        .orElse(item.osvId() == null ? "" : item.osvId());
  }

  private static int referencePriority(String value) {
    try {
      URI uri = URI.create(value);
      String host = StringUtils.defaultString(uri.getHost()).toLowerCase();
      String path = StringUtils.defaultString(uri.getPath()).toLowerCase();
      if (host.equals("github.com") && path.contains("/security/advisories/")) {
        return 1;
      }
      if (host.equals("nvd.nist.gov")) {
        return 2;
      }
      if (host.equals("github.com") && path.contains("/commit/")) {
        return 3;
      }
      if (host.equals("github.com") && path.contains("/pull/")) {
        return 4;
      }
      if (host.equals("github.com") && path.contains("/issues/")) {
        return 5;
      }
      if (host.contains("security.")
          || host.contains("access.redhat.com")
          || host.contains("debian.org")
          || host.contains("oracle.com")) {
        return 6;
      }
      if (host.contains("lists.apache.org")
          || host.contains("openwall.com")
          || path.contains("/lists/")) {
        return 8;
      }
      if (host.equals("github.com")) {
        return 7;
      }
      return 9;
    } catch (IllegalArgumentException ignored) {
      return 9;
    }
  }

  public ApplicationOverview overview(String iri) {

    long directDependencies = countDirectDependencies(iri);
    long transtiveDependencies = countTranstive(iri);
    long packages = countPackages(iri);
    long dependencyEdges = countDependencyEdges(iri);
    long vulnerablePackages = countVulnerablePackages(iri);
    long criticalVulnerabilities = countCriticalVulnerabilities(iri);

    return new ApplicationOverview(
        directDependencies,
        transtiveDependencies,
        packages,
        packages + 1,
        dependencyEdges,
        vulnerablePackages,
        criticalVulnerabilities,
        null);
  }

  public long countTranstive(String iri) {
    return count(
        iri,
        """
                            SELECT  (COUNT(DISTINCT ?dependency) AS ?count)
                                     WHERE
                                       { ?application risk:dependsOn/(risk:dependsOn)+ ?dependency
                                         FILTER NOT EXISTS { ?application
                                                                       risk:dependsOn  ?dependency
                                                           }
                                       }
                            """);
  }

  public List<DependencySummary> dependencySummary(String iri) {

    ParameterizedSparqlString sparql =
        new ParameterizedSparqlString(
            PREFIXES
                + """
                SELECT
                  ?package
                  ?name
                  ?version
                  ?purl
                  ?direct
                WHERE {

                  ?application risk:activeImport ?importRun .
                  ?importRun risk:rootOccurrence ?root .
                  ?root risk:belongsToImport ?importRun ; risk:dependsOn+ ?occurrence .
                  ?occurrence risk:belongsToImport ?importRun ; risk:instanceOf ?package .

                  ?package
                      rdf:type risk:PackageVersion ;
                      rdfs:label ?name .

                  OPTIONAL {
                    ?package risk:version ?version
                  }

                  OPTIONAL {
                    ?package risk:purl ?purl
                  }

                  BIND(
                    EXISTS {
                      ?root risk:dependsOn ?occurrence
                    }
                    AS ?direct
                  )
                }

                ORDER BY LCASE(?name)
                """);

    sparql.setIri("application", iri);

    return repository.execSelect(sparql.toString(), this::toDependencySummary);
  }

  public ApplicationVulnerabilitiesResponse getVulnerabilities(String applicationIri) {
    if (StringUtils.isBlank(applicationIri)) {
      throw new IllegalArgumentException("applicationIri is required");
    }

    ParameterizedSparqlString query =
        new ParameterizedSparqlString(PREFIXES + APPLICATION_VULNERABILITIES_QUERY);
    query.setIri("applicationValue", applicationIri.trim());

    Map<String, VulnerabilityAccumulator> accumulators = new LinkedHashMap<>();
    repository.execSelect(
        query.toString(),
        solution -> {
          accumulateVulnerability(accumulators, solution);
          return Boolean.TRUE;
        });

    List<ApplicationVulnerabilityItem> items =
        accumulators.values().stream().map(VulnerabilityAccumulator::toItem).toList();
    return new ApplicationVulnerabilitiesResponse(applicationIri.trim(), items.size(), items);
  }

  public ApplicationReferencesResponse getReferences(String applicationIri) {
    if (StringUtils.isBlank(applicationIri)) {
      throw new IllegalArgumentException("applicationIri is required");
    }

    ParameterizedSparqlString query =
        new ParameterizedSparqlString(PREFIXES + APPLICATION_REFERENCES_QUERY);
    query.setIri("applicationValue", applicationIri.trim());

    Map<String, AdvisoryReferenceAccumulator> grouped = new LinkedHashMap<>();
    repository.execSelect(
        query.toString(),
        solution -> {
          accumulateReference(grouped, solution);
          return Boolean.TRUE;
        });

    List<AdvisoryReferenceItem> items =
        grouped.values().stream()
            .map(AdvisoryReferenceAccumulator::toResponse)
            .sorted(ADVISORY_COMPARATOR)
            .toList();
    return new ApplicationReferencesResponse(applicationIri.trim(), items.size(), items);
  }

  private long countDirectDependencies(String iri) {

    return count(
        iri,
        """
            SELECT  (COUNT(DISTINCT ?dependency) AS ?count)
            WHERE
            { ?application
                  risk:dependsOn  ?dependency
             }
        """);
  }

  private long countPackages(String iri) {

    return count(
        iri,
        """
            SELECT  (COUNT(DISTINCT ?package) AS ?count)
            WHERE
              { ?application (risk:dependsOn)+ ?package }

        """);
  }

  private long countDependencyEdges(String iri) {

    return count(
        iri,
        """
            SELECT (COUNT(?target) AS ?count)
            WHERE {
              ?source risk:dependsOn ?target .

              FILTER (
                ?source = ?application
                ||
                EXISTS {
                  ?application risk:dependsOn+ ?source .
                }
              )
            }
            """);
  }

  private long countVulnerablePackages(String iri) {
    return count(
        iri,
        """
        SELECT (COUNT(DISTINCT ?package) AS ?count)
        WHERE {
          ?application risk:activeImport ?importRun .
          ?importRun risk:rootOccurrence ?root .
          ?root risk:belongsToImport ?importRun ; risk:dependsOn+ ?occurrence .
          ?occurrence risk:belongsToImport ?importRun ; risk:instanceOf ?package .
          ?package risk:affectedBy ?vulnerability .
        }
        """);
  }

  private long countCriticalVulnerabilities(String iri) {
    return count(
        iri,
        """
        SELECT (COUNT(DISTINCT ?vulnerability) AS ?count)
        WHERE {
          ?application risk:activeImport ?importRun .
          ?importRun risk:rootOccurrence ?root .
          ?root risk:belongsToImport ?importRun ; risk:dependsOn+ ?occurrence .
          ?occurrence risk:belongsToImport ?importRun ; risk:instanceOf ?package .
          ?package risk:affectedBy ?vulnerability .
          ?vulnerability risk:hasSeverity ?assessment .
          ?assessment risk:severityLevel ?severityLevel .
          FILTER(UCASE(STR(?severityLevel)) = "CRITICAL")
        }
        """);
  }

  private long count(String iri, String query) {

    ParameterizedSparqlString sparql = new ParameterizedSparqlString(PREFIXES + query);
    sparql.setIri("application", iri);
    return repository.execSelect(sparql.toString(), qs -> repository.getLong(qs, "count")).stream()
        .findFirst()
        .orElse(0L);
  }

  private DependencySummary toDependencySummary(QuerySolution solution) {

    return new DependencySummary(
        repository.getValue(solution, "package"),
        repository.getValue(solution, "name"),
        repository.getValue(solution, "version"),
        repository.getValue(solution, "purl"),
        repository.getBoolean(solution, "direct"));
  }

  private static final class VulnerabilityAccumulator {
    private final Set<String> aliases = new LinkedHashSet<>();
    private final Set<CvssAssessmentView> cvssAssessments = new LinkedHashSet<>();
    private final Set<FixedVersionView> fixedVersions = new LinkedHashSet<>();
    private final Set<String> referenceUrls = new LinkedHashSet<>();
    private String packageIri;
    private String packageName;
    private String installedVersion;
    private String installedPurl;
    private String dependencyType;
    private String vulnerabilityIri;
    private String osvId;
    private String summary;
    private String details;
    private String severityLevel;
    private Instant publishedAt;
    private Instant modifiedAt;

    private ApplicationVulnerabilityItem toItem() {
      return new ApplicationVulnerabilityItem(
          packageIri,
          packageName,
          installedVersion,
          installedPurl,
          dependencyType,
          vulnerabilityIri,
          osvId,
          List.copyOf(aliases),
          summary,
          details,
          severityLevel,
          publishedAt,
          modifiedAt,
          List.copyOf(cvssAssessments),
          List.copyOf(fixedVersions),
          List.copyOf(referenceUrls));
    }
  }

  private static final class AdvisoryReferenceAccumulator {
    private final Set<String> aliases = new LinkedHashSet<>();
    private final Set<AffectedPackageReference> affectedPackages = new LinkedHashSet<>();
    private final Set<String> referenceUrls = new LinkedHashSet<>();
    private String vulnerabilityIri;
    private String osvId;
    private String summary;

    private AdvisoryReferenceItem toResponse() {
      List<String> sortedAliases = aliases.stream().sorted(String.CASE_INSENSITIVE_ORDER).toList();
      List<AffectedPackageReference> sortedPackages =
          affectedPackages.stream().sorted(AFFECTED_PACKAGE_COMPARATOR).toList();
      List<String> sortedReferences = referenceUrls.stream().sorted(REFERENCE_COMPARATOR).toList();
      return new AdvisoryReferenceItem(
          vulnerabilityIri, osvId, sortedAliases, summary, sortedPackages, sortedReferences);
    }
  }
}
