package io.github.pkjpathania.dependencyrisk.workbench.assistant.service;

import io.github.pkjpathania.dependencyrisk.graph.model.AffectedPackage;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.util.GraphQueries;
import io.github.pkjpathania.dependencyrisk.mapper.QuerySolutionMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SparqlDelegate {

  private final JenaGraphRepository jenaGraphRepository;

  public List<AffectedPackage> getAffectedPackages() {
    return jenaGraphRepository.execSelect(
        GraphQueries.FIND_ALL_AFFECTED_PACKAGES, QuerySolutionMapper.affectedPackage());
  }
}
