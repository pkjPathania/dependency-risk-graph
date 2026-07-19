package io.github.pkjpathania.dependencyrisk.graph.repo;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.jena.query.ParameterizedSparqlString;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public final class JenaPackageOccurrenceRepository implements PackageOccurrenceRepository {
  private static final String PREFIX =
      "PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>\n";
  private final JenaGraphRepository repository;

  @Override
  public List<String> findOccurrences(String importRunIri, String packageVersionIri) {
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(
            PREFIX
                + "SELECT DISTINCT ?occurrence WHERE { ?occurrence risk:instanceOf ?package ; "
                + "risk:belongsToImport ?importRun . }");
    query.setIri("package", packageVersionIri);
    query.setIri("importRun", importRunIri);
    return repository.execSelect(query.toString(), row -> row.getResource("occurrence").getURI());
  }

  @Override
  public boolean occurrenceExistsInImport(String importRunIri, String occurrenceIri) {
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(
            PREFIX
                + "SELECT (COUNT(*) AS ?count) WHERE { ?occurrence risk:belongsToImport ?importRun . }");
    query.setIri("occurrence", occurrenceIri);
    query.setIri("importRun", importRunIri);
    return repository.execSelect(query.toString(), row -> repository.getLong(row, "count"))
        .stream().findFirst().orElse(0L) > 0;
  }
}
