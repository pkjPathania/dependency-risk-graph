package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.SparqlSelectResponse;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
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
}
