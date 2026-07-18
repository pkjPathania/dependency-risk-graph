package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathNode;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathResult;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathStatus;
import io.github.pkjpathania.dependencyrisk.graph.model.ImportContext;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.repo.PackageOccurrenceRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QuerySolution;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public final class JenaDependencyPathResolver implements DependencyPathResolver {
  private static final String PREFIX =
      "PREFIX risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>\n"
          + "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
          + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n";
  private final JenaGraphRepository repository;
  private final PackageOccurrenceRepository occurrenceRepository;

  @Override
  public DependencyPathResult resolve(
      ImportContext importContext, String targetPackageVersionIri) {
    Instant started = Instant.now();
    List<String> targets =
        occurrenceRepository.findOccurrences(
            importContext.importRunIri(), targetPackageVersionIri);
    DependencyPathResult result;
    if (!occurrenceRepository.occurrenceExistsInImport(
        importContext.importRunIri(), importContext.rootOccurrenceIri())) {
      result = result(importContext, targetPackageVersionIri,
          DependencyPathStatus.ROOT_OCCURRENCE_NOT_FOUND, null, List.of(),
          "Persisted root occurrence does not exist in the import");
    } else if (targets.isEmpty()) {
      result = result(importContext, targetPackageVersionIri,
          DependencyPathStatus.TARGET_PACKAGE_NOT_FOUND_IN_IMPORT, null, List.of(),
          "Canonical package version has no occurrence in this import");
    } else {
      Map<String, Set<String>> adjacency = loadAdjacency(importContext.importRunIri());
      Search search = bfs(importContext.rootOccurrenceIri(), Set.copyOf(targets), adjacency);
      if (search.target() == null) {
        result = result(importContext, targetPackageVersionIri,
            DependencyPathStatus.TARGET_OCCURRENCE_UNREACHABLE, null, List.of(),
            "A target occurrence exists in the import but is unreachable from its persisted root");
      } else {
        List<String> iris = rebuild(importContext.rootOccurrenceIri(), search.target(), search.previous());
        result = result(importContext, targetPackageVersionIri,
            DependencyPathStatus.PATH_RESOLVED, search.target(), loadNodes(iris), "Path resolved");
      }
    }
    log.info(
        "Dependency path importId={} importRunIri={} rootOccurrenceIri={} targetPackageVersionIri={} targetOccurrenceCount={} pathStatus={} hopCount={} durationMs={}",
        importContext.importId(), importContext.importRunIri(), importContext.rootOccurrenceIri(),
        targetPackageVersionIri, targets.size(), result.status(),
        Math.max(0, result.path().size() - 1), Duration.between(started, Instant.now()).toMillis());
    return result;
  }

  private Map<String, Set<String>> loadAdjacency(String importRunIri) {
    ParameterizedSparqlString query = new ParameterizedSparqlString(
        PREFIX + "SELECT DISTINCT ?parent ?child WHERE { "
            + "?parent risk:dependsOn ?child ; risk:belongsToImport ?importRun . "
            + "?child risk:belongsToImport ?importRun . }");
    query.setIri("importRun", importRunIri);
    Map<String, Set<String>> adjacency = new LinkedHashMap<>();
    repository.execSelect(query.toString(), row -> {
      adjacency.computeIfAbsent(row.getResource("parent").getURI(), ignored -> new LinkedHashSet<>())
          .add(row.getResource("child").getURI());
      return Boolean.TRUE;
    });
    return adjacency;
  }

  private Search bfs(String root, Set<String> targets, Map<String, Set<String>> adjacency) {
    Queue<String> queue = new ArrayDeque<>();
    Set<String> visited = new LinkedHashSet<>();
    Map<String, String> previous = new HashMap<>();
    queue.add(root);
    visited.add(root);
    while (!queue.isEmpty()) {
      String current = queue.remove();
      if (targets.contains(current)) return new Search(current, previous);
      for (String child : adjacency.getOrDefault(current, Set.of())) {
        if (visited.add(child)) {
          previous.put(child, current);
          queue.add(child);
        }
      }
    }
    return new Search(null, previous);
  }

  private List<String> rebuild(String root, String target, Map<String, String> previous) {
    List<String> path = new ArrayList<>();
    for (String current = target; current != null; current = previous.get(current)) {
      path.add(current);
      if (current.equals(root)) break;
    }
    Collections.reverse(path);
    return List.copyOf(path);
  }

  private List<DependencyPathNode> loadNodes(List<String> iris) {
    return iris.stream().map(this::loadNode).toList();
  }

  private DependencyPathNode loadNode(String iri) {
    ParameterizedSparqlString query = new ParameterizedSparqlString(
        PREFIX + "SELECT ?label ?version ?purl ?type WHERE { "
            + "OPTIONAL { ?occurrence rdfs:label ?label } "
            + "OPTIONAL { ?occurrence risk:version ?version } "
            + "OPTIONAL { ?occurrence rdf:type ?type } "
            + "OPTIONAL { ?occurrence risk:instanceOf ?canonical . OPTIONAL { ?canonical risk:purl ?purl } } } LIMIT 1");
    query.setIri("occurrence", iri);
    return repository.execSelect(query.toString(), row -> node(iri, row)).stream().findFirst()
        .orElse(new DependencyPathNode(iri, null, null, null, null));
  }

  private DependencyPathNode node(String iri, QuerySolution row) {
    return new DependencyPathNode(iri, value(row, "label"), value(row, "version"),
        value(row, "purl"), value(row, "type"));
  }

  private String value(QuerySolution row, String name) {
    return row.contains(name) ? repository.getValue(row, name) : null;
  }

  private DependencyPathResult result(ImportContext context, String packageIri,
      DependencyPathStatus status, String matched, List<DependencyPathNode> path, String message) {
    return new DependencyPathResult(status, context.importId(), context.rootOccurrenceIri(),
        packageIri, matched, path, message);
  }

  private record Search(String target, Map<String, String> previous) {}
}
