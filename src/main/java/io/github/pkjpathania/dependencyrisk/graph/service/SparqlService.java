package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationSummary;
import io.github.pkjpathania.dependencyrisk.graph.model.SparqlSelectResponse;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.util.SparqlUtil;
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

  public SparqlSelectResponse execute(String query) {
    Query validatedQuery = SparqlUtil.from(query);
    if (!validatedQuery.isSelectType())
      throw new IllegalStateException("Only select queries are selected ");
    return repository.of(validatedQuery);
  }

  public List<ApplicationSummary> getSummaries() {
    String query =
"""
  PREFIX  risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>
  PREFIX  rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  SELECT  ?application ?name ?version ?purl
  WHERE
    { ?application  a  risk:Application
      OPTIONAL
        { ?application  rdfs:label  ?name }
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
