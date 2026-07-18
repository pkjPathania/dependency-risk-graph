package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationView;
import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactDetailResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactListItem;
import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactListResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.CvssAssessmentView;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathNode;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathResult;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathStatus;
import io.github.pkjpathania.dependencyrisk.graph.model.ImportContext;
import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactStatus;
import io.github.pkjpathania.dependencyrisk.graph.model.ExposurePath;
import io.github.pkjpathania.dependencyrisk.graph.model.FixedVersionView;
import io.github.pkjpathania.dependencyrisk.graph.model.ImpactGraph;
import io.github.pkjpathania.dependencyrisk.graph.model.ImpactGraphEdge;
import io.github.pkjpathania.dependencyrisk.graph.model.ImpactGraphNode;
import io.github.pkjpathania.dependencyrisk.graph.model.PackageVersionView;
import io.github.pkjpathania.dependencyrisk.graph.model.PathNodeView;
import io.github.pkjpathania.dependencyrisk.graph.model.VulnerabilityDetail;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.repo.ImportContextRepository;
import io.github.pkjpathania.dependencyrisk.graph.repo.PackageOccurrenceRepository;
import java.time.DateTimeException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QuerySolution;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CveImpactService {

  private static final String PREFIXES =
      """
      PREFIX risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>
      PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      """;

  private final JenaGraphRepository repository;
  private final ImportContextRepository importContextRepository;
  private final PackageOccurrenceRepository packageOccurrenceRepository;
  private final DependencyPathResolver dependencyPathResolver;

  public CveImpactListResponse list(String scopeValue, String applicationIri) {
    Scope scope = validateScope(scopeValue, applicationIri);
    ParameterizedSparqlString query = new ParameterizedSparqlString(listQuery(scope));
    bindApplication(query, scope, applicationIri);

    Map<String, ListAccumulator> grouped = new LinkedHashMap<>();
    repository.execSelect(
        query.toString(),
        solution -> {
          accumulateListRow(grouped, solution);
          return Boolean.TRUE;
        });

    List<CveImpactListItem> items =
        grouped.values().stream()
            .map(ListAccumulator::toItem)
            .sorted(
                Comparator.comparingInt(CveImpactListItem::affectedApplicationCount)
                    .reversed()
                    .thenComparing(
                        CveImpactListItem::preferredIdentifier,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                    .thenComparing(
                        CveImpactListItem::osvId,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
            .toList();
    return new CveImpactListResponse(
        scope.value, scope == Scope.SELECTED ? applicationIri.trim() : null, items.size(), items);
  }

  public CveImpactDetailResponse detail(
      String vulnerabilityIri, String scopeValue, String applicationIri) {
    if (StringUtils.isBlank(vulnerabilityIri)) {
      throw new IllegalArgumentException("vulnerabilityIri is required");
    }
    Scope scope = validateScope(scopeValue, applicationIri);
    String normalizedVulnerabilityIri = vulnerabilityIri.trim();

    DetailAccumulator detail = loadVulnerability(normalizedVulnerabilityIri);
    if (detail.osvId == null) {
      throw new NoSuchElementException("Vulnerability not found: " + normalizedVulnerabilityIri);
    }

    List<ExposureTarget> targets = loadExposureTargets(normalizedVulnerabilityIri, scope, applicationIri);
    List<ExposurePath> exposures =
        targets.stream()
            .map(target -> resolveExposure(target, normalizedVulnerabilityIri))
            .toList();
    ImpactGraph graph = buildGraph(detail, exposures);
    VulnerabilityDetail vulnerability = detail.toVulnerability(targets);

    return new CveImpactDetailResponse(
        vulnerability,
        exposures,
        List.copyOf(detail.fixedVersions),
        List.copyOf(detail.cvssAssessments),
        List.copyOf(detail.referenceUrls),
        graph);
  }

  private DetailAccumulator loadVulnerability(String vulnerabilityIri) {
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(PREFIXES + VULNERABILITY_DETAIL_QUERY);
    query.setIri("vulnerabilityValue", vulnerabilityIri);
    DetailAccumulator detail = new DetailAccumulator(vulnerabilityIri);
    repository.execSelect(
        query.toString(),
        solution -> {
          detail.accumulate(solution);
          return Boolean.TRUE;
        });
    return detail;
  }

  private List<ExposureTarget> loadExposureTargets(
      String vulnerabilityIri, Scope scope, String applicationIri) {
    ParameterizedSparqlString query = new ParameterizedSparqlString(exposureQuery(scope));
    query.setIri("vulnerabilityValue", vulnerabilityIri);
    bindApplication(query, scope, applicationIri);
    return repository.execSelect(query.toString(), CveImpactService::toExposureTarget).stream()
        .distinct()
        .toList();
  }

  private ExposurePath resolveExposure(ExposureTarget target, String vulnerabilityIri) {
    String exposureId = target.application.iri() + "\u0000" + target.vulnerablePackage.iri();
    try {
      ImportContext importContext = target.importContext();
      DependencyPathResult result =
          dependencyPathResolver.resolve(importContext, target.vulnerablePackage.iri());
      if (result.status() != DependencyPathStatus.PATH_RESOLVED) {
        return unavailableExposure(exposureId, target, vulnerabilityIri);
      }

      List<PathNodeView> path =
          result.path().stream().map(CveImpactService::toPathNode).collect(ArrayList::new, List::add, List::addAll);
      path.add(
          new PathNodeView(
              target.vulnerablePackage.iri(),
              target.vulnerablePackage.name(),
              target.vulnerablePackage.version(),
              target.vulnerablePackage.purl(),
              "PACKAGE_VERSION"));
      path.add(new PathNodeView(vulnerabilityIri, null, null, null, "VULNERABILITY"));
      List<String> nodeIds = path.stream().map(PathNodeView::iri).toList();
      List<String> edgeIds = new ArrayList<>();
      for (int index = 0; index < result.path().size() - 1; index++) {
        edgeIds.add(edgeId(result.path().get(index).occurrenceIri(), "DEPENDS_ON", result.path().get(index + 1).occurrenceIri()));
      }
      edgeIds.add(
          edgeId(result.matchedOccurrenceIri(), "INSTANCE_OF", target.vulnerablePackage.iri()));
      edgeIds.add(edgeId(target.vulnerablePackage.iri(), "AFFECTED_BY", vulnerabilityIri));
      return new ExposurePath(
          exposureId,
          target.application,
          target.vulnerablePackage,
          result.path().size() == 2 ? "DIRECT" : "TRANSITIVE",
          Math.max(0, result.path().size() - 1),
          CveImpactStatus.AFFECTED_PATH_RESOLVED.name(),
          path,
          nodeIds,
          edgeIds);
    } catch (IllegalArgumentException | NoSuchElementException exception) {
      log.warn(
          "Dependency path unavailable for application {} and package {} affected by {}: {}",
          target.application.iri(),
          target.vulnerablePackage.iri(),
          vulnerabilityIri,
          exception.getMessage());
      return unavailableExposure(exposureId, target, vulnerabilityIri);
    }
  }

  private ExposurePath unavailableExposure(
      String exposureId, ExposureTarget target, String vulnerabilityIri) {
    return new ExposurePath(
        exposureId,
        target.application,
        target.vulnerablePackage,
        CveImpactStatus.AFFECTED_PATH_UNAVAILABLE.name(),
        0,
        "PATH_UNAVAILABLE",
        List.of(),
        List.of(target.application.iri(), target.vulnerablePackage.iri(), vulnerabilityIri),
        List.of(edgeId(target.vulnerablePackage.iri(), "AFFECTED_BY", vulnerabilityIri)));
  }

  private ImpactGraph buildGraph(DetailAccumulator detail, List<ExposurePath> exposures) {
    Map<String, ImpactGraphNode> nodes = new LinkedHashMap<>();
    Map<String, EdgeAccumulator> edges = new LinkedHashMap<>();
    Map<String, Long> applicationExposureCounts =
        exposures.stream()
            .collect(
                java.util.stream.Collectors.groupingBy(
                    exposure -> exposure.application().iri(), LinkedHashMap::new, java.util.stream.Collectors.counting()));
    Map<String, Set<String>> applicationsByNode = new LinkedHashMap<>();
    for (ExposurePath exposure : exposures) {
      for (String nodeId : exposure.pathNodeIds()) {
        applicationsByNode
            .computeIfAbsent(nodeId, ignored -> new LinkedHashSet<>())
            .add(exposure.application().name());
      }
    }

    nodes.put(
        detail.vulnerabilityIri,
        new ImpactGraphNode(
            detail.vulnerabilityIri,
            detail.vulnerabilityIri,
            detail.preferredIdentifier(),
            null,
            "VULNERABILITY",
            Map.of(
                "osvId", StringUtils.defaultString(detail.osvId),
                "severity", StringUtils.defaultString(detail.severityLevel, "UNRATED"),
                "affectedApplicationCount", applicationExposureCounts.size(),
                "affectedPackageVersionCount",
                    exposures.stream().map(exposure -> exposure.vulnerablePackage().iri()).distinct().count())));

    for (ExposurePath exposure : exposures) {
      if (exposure.path().isEmpty()) {
        putApplication(nodes, exposure.application(), applicationExposureCounts.getOrDefault(exposure.application().iri(), 0L));
        putPackage(nodes, exposure.vulnerablePackage(), "VULNERABLE_PACKAGE", applicationsByNode.get(exposure.vulnerablePackage().iri()));
      } else {
        for (int index = 0; index < exposure.path().size() - 1; index++) {
          PathNodeView node = exposure.path().get(index);
          String nodeType =
              index == 0
                  ? "APPLICATION"
                  : node.iri().equals(exposure.vulnerablePackage().iri())
                      ? "VULNERABLE_PACKAGE"
                      : "DEPENDENCY";
          nodes.putIfAbsent(
              node.iri(),
              new ImpactGraphNode(
                  node.iri(),
                  node.iri(),
                  node.label(),
                  node.version(),
                  nodeType,
                  nodeType.equals("APPLICATION")
                      ? Map.of(
                          "exposureCount",
                          applicationExposureCounts.getOrDefault(node.iri(), 0L))
                      : Map.of(
                          "purl", StringUtils.defaultString(node.purl()),
                          "applications",
                              List.copyOf(
                                  applicationsByNode.getOrDefault(node.iri(), Set.of())))));
        }
        for (int index = 0; index < exposure.path().size() - 2; index++) {
          mergeEdge(
              edges,
              exposure.path().get(index).iri(),
              "DEPENDS_ON",
              exposure.path().get(index + 1).iri(),
              exposure.exposureId());
        }
      }
      mergeEdge(
          edges,
          exposure.vulnerablePackage().iri(),
          "AFFECTED_BY",
          detail.vulnerabilityIri,
          exposure.exposureId());
    }

    for (FixedVersionView fixed : detail.fixedVersions) {
      nodes.putIfAbsent(
          fixed.iri(),
          new ImpactGraphNode(
              fixed.iri(),
              fixed.iri(),
              fixed.packageName(),
              fixed.version(),
              "FIXED_VERSION",
              Map.of("purl", StringUtils.defaultString(fixed.purl()))));
      mergeEdge(edges, detail.vulnerabilityIri, "FIXED_IN", fixed.iri(), null);
    }

    return new ImpactGraph(
        List.copyOf(nodes.values()), edges.values().stream().map(EdgeAccumulator::toEdge).toList());
  }

  private static void putApplication(
      Map<String, ImpactGraphNode> nodes, ApplicationView application, long exposureCount) {
    nodes.putIfAbsent(
        application.iri(),
        new ImpactGraphNode(
            application.iri(), application.iri(), application.name(), application.version(), "APPLICATION", Map.of("exposureCount", exposureCount)));
  }

  private static void putPackage(
      Map<String, ImpactGraphNode> nodes,
      PackageVersionView pkg,
      String nodeType,
      Set<String> applications) {
    nodes.putIfAbsent(
        pkg.iri(),
        new ImpactGraphNode(
            pkg.iri(),
            pkg.iri(),
            pkg.name(),
            pkg.version(),
            nodeType,
            Map.of(
                "purl", StringUtils.defaultString(pkg.purl()),
                "applications", List.copyOf(applications == null ? Set.of() : applications))));
  }

  private static void mergeEdge(
      Map<String, EdgeAccumulator> edges,
      String source,
      String relationship,
      String target,
      String exposureId) {
    String id = edgeId(source, relationship, target);
    EdgeAccumulator edge =
        edges.computeIfAbsent(id, ignored -> new EdgeAccumulator(id, source, target, relationship));
    if (exposureId != null) {
      edge.exposureIds.add(exposureId);
    }
  }

  private static String edgeId(String source, String relationship, String target) {
    return source + "\u0000" + relationship + "\u0000" + target;
  }

  private static PathNodeView toPathNode(DependencyPathNode node) {
    return new PathNodeView(node.occurrenceIri(), node.label(), node.version(), node.purl(), node.type());
  }

  private static ExposureTarget toExposureTarget(QuerySolution solution) {
    return new ExposureTarget(
        new ApplicationView(
            resourceIri(solution, "application"),
            literalValue(solution, "applicationName"),
            literalValue(solution, "applicationVersion")),
        new PackageVersionView(
            resourceIri(solution, "package"),
            literalValue(solution, "packageName"),
            literalValue(solution, "installedVersion"),
            literalValue(solution, "installedPurl")),
        new ImportContext(
            literalValue(solution, "importId"),
            resourceIri(solution, "importRun"),
            resourceIri(solution, "rootOccurrence")));
  }

  private static void accumulateListRow(
      Map<String, ListAccumulator> grouped, QuerySolution solution) {
    String vulnerabilityIri = resourceIri(solution, "vulnerability");
    if (vulnerabilityIri == null) {
      return;
    }
    ListAccumulator item =
        grouped.computeIfAbsent(vulnerabilityIri, ListAccumulator::new);
    item.osvId = first(item.osvId, literalValue(solution, "osvId"));
    item.summary = first(item.summary, literalValue(solution, "summary"));
    item.severityLevel = first(item.severityLevel, literalValue(solution, "severityLevel"));
    add(item.aliases, literalValue(solution, "alias"));
    add(item.applicationIris, resourceIri(solution, "application"));
    add(item.applicationNames, literalValue(solution, "applicationName"));
    add(item.packageIris, resourceIri(solution, "package"));
    add(item.packageNames, literalValue(solution, "packageName"));
    add(item.referenceUrls, literalValue(solution, "referenceUrl"));
  }

  private Scope validateScope(String value, String applicationIri) {
    Scope scope = Scope.from(value);
    if (scope == Scope.SELECTED && StringUtils.isBlank(applicationIri)) {
      throw new IllegalArgumentException("applicationIri is required for selected scope");
    }
    return scope;
  }

  private static void bindApplication(
      ParameterizedSparqlString query, Scope scope, String applicationIri) {
    if (scope == Scope.SELECTED) {
      query.setIri("applicationValue", applicationIri.trim());
    }
  }

  private static String listQuery(Scope scope) {
    return PREFIXES + LIST_QUERY.replace("#SCOPE#", scope.valuesClause());
  }

  private static String exposureQuery(Scope scope) {
    return PREFIXES + EXPOSURE_QUERY.replace("#SCOPE#", scope.valuesClause());
  }

  private static String resourceIri(QuerySolution solution, String variable) {
    return solution.contains(variable) && solution.get(variable).isURIResource()
        ? solution.getResource(variable).getURI()
        : null;
  }

  private static String literalValue(QuerySolution solution, String variable) {
    return solution.contains(variable) && solution.get(variable).isLiteral()
        ? StringUtils.trimToNull(solution.getLiteral(variable).getString())
        : null;
  }

  private static Instant instantValue(QuerySolution solution, String variable) {
    String value = literalValue(solution, variable);
    try {
      return value == null ? null : Instant.parse(value);
    } catch (DateTimeException ignored) {
      return null;
    }
  }

  private static <T> T first(T current, T candidate) {
    return current == null ? candidate : current;
  }

  private static void add(Set<String> values, String value) {
    if (value != null) {
      values.add(value);
    }
  }

  private enum Scope {
    SELECTED("selected"),
    ALL("all");

    private final String value;

    Scope(String value) {
      this.value = value;
    }

    private String valuesClause() {
      return this == SELECTED ? "VALUES ?application { ?applicationValue }" : "";
    }

    private static Scope from(String value) {
      String normalized = StringUtils.defaultIfBlank(value, "selected").trim();
      for (Scope scope : values()) {
        if (scope.value.equalsIgnoreCase(normalized)) {
          return scope;
        }
      }
      throw new IllegalArgumentException("scope must be selected or all");
    }
  }

  private static final class ListAccumulator {
    private final String vulnerabilityIri;
    private String osvId;
    private String summary;
    private String severityLevel;
    private final Set<String> aliases = new LinkedHashSet<>();
    private final Set<String> applicationIris = new LinkedHashSet<>();
    private final Set<String> applicationNames = new LinkedHashSet<>();
    private final Set<String> packageIris = new LinkedHashSet<>();
    private final Set<String> packageNames = new LinkedHashSet<>();
    private final Set<String> referenceUrls = new LinkedHashSet<>();

    private ListAccumulator(String vulnerabilityIri) {
      this.vulnerabilityIri = vulnerabilityIri;
    }

    private String preferredIdentifier() {
      return aliases.stream()
          .filter(alias -> alias.regionMatches(true, 0, "CVE-", 0, 4))
          .findFirst()
          .orElse(osvId);
    }

    private CveImpactListItem toItem() {
      return new CveImpactListItem(
          vulnerabilityIri,
          preferredIdentifier(),
          osvId,
          aliases.stream().sorted(String.CASE_INSENSITIVE_ORDER).toList(),
          summary,
          severityLevel,
          applicationIris.size(),
          packageIris.size(),
          referenceUrls.size(),
          applicationNames.stream().sorted(String.CASE_INSENSITIVE_ORDER).toList(),
          packageNames.stream().sorted(String.CASE_INSENSITIVE_ORDER).toList());
    }
  }

  private static final class DetailAccumulator {
    private final String vulnerabilityIri;
    private String osvId;
    private String summary;
    private String details;
    private String severityLevel;
    private Instant publishedAt;
    private Instant modifiedAt;
    private final Set<String> aliases = new LinkedHashSet<>();
    private final Set<String> referenceUrls = new LinkedHashSet<>();
    private final Set<CvssAssessmentView> cvssAssessments = new LinkedHashSet<>();
    private final Set<FixedVersionView> fixedVersions = new LinkedHashSet<>();

    private DetailAccumulator(String vulnerabilityIri) {
      this.vulnerabilityIri = vulnerabilityIri;
    }

    private void accumulate(QuerySolution solution) {
      osvId = first(osvId, literalValue(solution, "osvId"));
      summary = first(summary, literalValue(solution, "summary"));
      details = first(details, literalValue(solution, "details"));
      severityLevel = first(severityLevel, literalValue(solution, "severityLevel"));
      publishedAt = first(publishedAt, instantValue(solution, "publishedAt"));
      modifiedAt = first(modifiedAt, instantValue(solution, "modifiedAt"));
      add(aliases, literalValue(solution, "alias"));
      add(referenceUrls, literalValue(solution, "referenceUrl"));
      String vector = literalValue(solution, "vector");
      if (vector != null) {
        cvssAssessments.add(
            new CvssAssessmentView(
                resourceIri(solution, "assessment"),
                literalValue(solution, "cvssType"),
                literalValue(solution, "cvssVersion"),
                vector));
      }
      String fixedVersion = literalValue(solution, "fixedVersion");
      String fixedIri = resourceIri(solution, "fixedPackage");
      if (fixedVersion != null && fixedIri != null) {
        fixedVersions.add(
            new FixedVersionView(
                fixedIri,
                literalValue(solution, "fixedPackageName"),
                fixedVersion,
                literalValue(solution, "fixedPurl")));
      }
    }

    private String preferredIdentifier() {
      return aliases.stream()
          .filter(alias -> alias.regionMatches(true, 0, "CVE-", 0, 4))
          .findFirst()
          .orElse(osvId);
    }

    private VulnerabilityDetail toVulnerability(List<ExposureTarget> targets) {
      return new VulnerabilityDetail(
          vulnerabilityIri,
          preferredIdentifier(),
          osvId,
          List.copyOf(aliases),
          summary,
          details,
          severityLevel,
          publishedAt,
          modifiedAt,
          (int) targets.stream().map(target -> target.application.iri()).distinct().count(),
          (int) targets.stream().map(target -> target.vulnerablePackage.iri()).distinct().count());
    }
  }

  private record ExposureTarget(
      ApplicationView application,
      PackageVersionView vulnerablePackage,
      ImportContext importContext) {}

  private static final class EdgeAccumulator {
    private final String id;
    private final String source;
    private final String target;
    private final String relationship;
    private final Set<String> exposureIds = new LinkedHashSet<>();

    private EdgeAccumulator(String id, String source, String target, String relationship) {
      this.id = id;
      this.source = source;
      this.target = target;
      this.relationship = relationship;
    }

    private ImpactGraphEdge toEdge() {
      return new ImpactGraphEdge(id, source, target, relationship, List.copyOf(exposureIds));
    }
  }

  private static final String LIST_QUERY =
      """
      SELECT DISTINCT
          ?vulnerability ?osvId ?alias ?summary ?severityLevel
          ?application ?applicationName ?importRun ?rootOccurrence ?occurrence ?package ?packageName ?installedVersion ?referenceUrl
      WHERE {
          ?application a risk:Application ; rdfs:label ?applicationName ; risk:activeImport ?importRun .
          #SCOPE#
          ?importRun risk:rootOccurrence ?rootOccurrence .
          ?rootOccurrence risk:belongsToImport ?importRun .
          ?occurrence risk:belongsToImport ?importRun ; risk:instanceOf ?package .
          ?package a risk:PackageVersion ; rdfs:label ?packageName ;
                   risk:version ?installedVersion ; risk:affectedBy ?vulnerability .
          ?vulnerability a risk:Vulnerability ; risk:osvId ?osvId .
          OPTIONAL { ?vulnerability risk:alias ?alias . }
          OPTIONAL { ?vulnerability risk:summary ?summary . }
          OPTIONAL { ?vulnerability risk:severityLevel ?vulnerabilitySeverity . }
          OPTIONAL {
              ?vulnerability risk:hasSeverity ?severityAssessment .
              ?severityAssessment risk:severityLevel ?assessmentSeverity .
          }
          BIND(COALESCE(?vulnerabilitySeverity, ?assessmentSeverity) AS ?severityLevel)
          OPTIONAL { ?vulnerability risk:referenceUrl ?referenceUrl . }
      }
      ORDER BY LCASE(STR(?osvId)) LCASE(STR(?applicationName)) LCASE(STR(?packageName))
      """;

  private static final String EXPOSURE_QUERY =
      """
      SELECT DISTINCT ?application ?applicationName ?applicationVersion
                      ?importRun ?importId ?rootOccurrence ?package ?packageName ?installedVersion ?installedPurl
      WHERE {
          VALUES ?vulnerability { ?vulnerabilityValue }
          ?application a risk:Application ; rdfs:label ?applicationName ; risk:activeImport ?importRun .
          #SCOPE#
          OPTIONAL { ?application risk:version ?applicationVersion . }
          ?importRun risk:importId ?importId ; risk:rootOccurrence ?rootOccurrence .
          ?rootOccurrence risk:belongsToImport ?importRun .
          ?occurrence risk:belongsToImport ?importRun ; risk:instanceOf ?package .
          ?package a risk:PackageVersion ; rdfs:label ?packageName ;
                   risk:version ?installedVersion ; risk:affectedBy ?vulnerability .
          OPTIONAL { ?package risk:purl ?installedPurl . }
      }
      ORDER BY LCASE(STR(?applicationName)) LCASE(STR(?packageName)) STR(?installedVersion)
      """;

  private static final String VULNERABILITY_DETAIL_QUERY =
      """
      SELECT ?osvId ?alias ?summary ?details ?severityLevel ?publishedAt ?modifiedAt
             ?assessment ?cvssType ?cvssVersion ?vector
             ?fixedPackage ?fixedPackageName ?fixedVersion ?fixedPurl ?referenceUrl
      WHERE {
          VALUES ?vulnerability { ?vulnerabilityValue }
          ?vulnerability a risk:Vulnerability ; risk:osvId ?osvId .
          OPTIONAL { ?vulnerability risk:alias ?alias . }
          OPTIONAL { ?vulnerability risk:summary ?summary . }
          OPTIONAL { ?vulnerability risk:details ?details . }
          OPTIONAL { ?vulnerability risk:severityLevel ?vulnerabilitySeverity . }
          OPTIONAL {
              ?vulnerability risk:hasSeverity ?severityAssessment .
              ?severityAssessment risk:severityLevel ?assessmentSeverity .
          }
          BIND(COALESCE(?vulnerabilitySeverity, ?assessmentSeverity) AS ?severityLevel)
          OPTIONAL { ?vulnerability risk:publishedAt ?publishedAt . }
          OPTIONAL { ?vulnerability risk:modifiedAt ?modifiedAt . }
          OPTIONAL { ?vulnerability risk:referenceUrl ?referenceUrl . }
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
      }
      """;
}
