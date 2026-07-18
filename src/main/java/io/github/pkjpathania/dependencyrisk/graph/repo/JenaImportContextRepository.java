package io.github.pkjpathania.dependencyrisk.graph.repo;

import io.github.pkjpathania.dependencyrisk.graph.model.ImportContext;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QuerySolution;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public final class JenaImportContextRepository implements ImportContextRepository {
  private static final String PREFIX =
      "PREFIX risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>\n";
  private final JenaGraphRepository repository;

  @Override
  public Optional<ImportContext> findByImportId(String importId) {
    ParameterizedSparqlString query = new ParameterizedSparqlString(PREFIX + BASE + " FILTER(?id = ?value) }");
    query.setLiteral("value", importId);
    return first(query);
  }

  @Override
  public Optional<ImportContext> findByApplicationId(String applicationId) {
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(
            PREFIX + BASE + " ?application risk:activeImport ?importRun . FILTER(?application = ?value) }");
    query.setIri("value", applicationId);
    return first(query);
  }

  @Override
  public Optional<ImportContext> findByRootOccurrenceIri(String rootOccurrenceIri) {
    ParameterizedSparqlString query = new ParameterizedSparqlString(PREFIX + BASE + " FILTER(?root = ?value) }");
    query.setIri("value", rootOccurrenceIri);
    return first(query);
  }

  private Optional<ImportContext> first(ParameterizedSparqlString query) {
    return repository.execSelect(query.toString(), this::map).stream().findFirst();
  }

  private ImportContext map(QuerySolution solution) {
    return new ImportContext(
        solution.getLiteral("id").getString(),
        solution.getResource("importRun").getURI(),
        solution.getResource("root").getURI());
  }

  private static final String BASE =
      "SELECT DISTINCT ?importRun ?id ?root WHERE { "
          + "?importRun a risk:ImportRun ; risk:importId ?id ; risk:rootOccurrence ?root . ";
}
