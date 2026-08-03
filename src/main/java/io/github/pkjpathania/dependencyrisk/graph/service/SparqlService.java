package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationSummary;
import io.github.pkjpathania.dependencyrisk.graph.model.SparqlSelectResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.SparqlStatsResponse;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.util.SparqlUtil;
import io.github.pkjpathania.dependencyrisk.util.ArqAlgebraUtil;
import io.github.pkjpathania.dependencyrisk.util.ArqAlgebraUtil.ArqAlgebra;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.jena.query.Query;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class SparqlService {

  private final JenaGraphRepository repository;

  private final ObjectMapper objectMapper;

  public String format(String query) {
    return objectMapper.writeValueAsString(SparqlUtil.format(query));
  }

  public SparqlStatsResponse stats(String query) {
    ArqAlgebra algebra = ArqAlgebraUtil.inspect(query);
    return new SparqlStatsResponse(
        algebra.raw().toString(),
        algebra.optimized().toString(),
        algebra.rawSse(),
        algebra.optimizedSse());
  }

  public SparqlSelectResponse execute(String query) {
    Query validatedQuery = SparqlUtil.from(query);
    if (!validatedQuery.isSelectType())
      throw new IllegalStateException("Only select queries are selected ");
    return repository.of(validatedQuery);
  }

  public List<ApplicationSummary> getSummaries() {
    String query =
"""
  PREFIX  risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>
  SELECT  ?application ?name ?version ?purl
  WHERE
    { ?application  a  risk:ApplicationOccurrence
      OPTIONAL
        { ?application  risk:name  ?name }
      OPTIONAL
        { ?application  risk:version  ?version }
      OPTIONAL
        { ?application  risk:purl  ?purl }
    }
""";

    Query sparql = SparqlUtil.selectOnly(query);
    return repository.summaries(sparql);
  }
}
