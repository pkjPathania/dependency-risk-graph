package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationOverview;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencySummary;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QuerySolution;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExplorerService {

  private static final String PREFIXES =
      """
      PREFIX risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>
      PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      """;

  private final JenaGraphRepository repository;

  public ApplicationOverview overview(String iri) {

    long directDependencies = countDirectDependencies(iri);
    long packages = countPackages(iri);
    long dependencyEdges = countDependencyEdges(iri);

    return new ApplicationOverview(
        directDependencies,
        Math.max(0L, packages - directDependencies),
        packages,
        packages + 1,
        dependencyEdges,
        null,
        null,
        null);
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

                  ?application risk:dependsOn+ ?package .

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
                      ?application risk:dependsOn ?package
                    }
                    AS ?direct
                  )
                }

                ORDER BY LCASE(?name)
                """);

    sparql.setIri("application", iri);

    return repository.execSelect(sparql.toString(), this::toDependencySummary);
  }

  private long countDirectDependencies(String iri) {

    return count(
        iri,
        """
        SELECT (COUNT(DISTINCT ?dependency) AS ?count)
        WHERE {
          ?application risk:dependsOn ?dependency .
        }
        """);
  }

  private long countPackages(String iri) {

    return count(
        iri,
        """
        SELECT (COUNT(DISTINCT ?package) AS ?count)
        WHERE {
          ?application risk:dependsOn+ ?package .
        }
        """);
  }

  private long countDependencyEdges(String iri) {

    return count(
        iri,
        """
        SELECT (COUNT(DISTINCT ?edge) AS ?count)
        WHERE {

          ?application risk:dependsOn* ?source .

          ?source risk:dependsOn ?target .

          BIND(
            CONCAT(
              STR(?source),
              "|",
              STR(?target)
            )
            AS ?edge
          )
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
}
