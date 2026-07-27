package io.github.pkjpathania.dependencyrisk.workbench.graphql.service;

import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.mapper.ApplicationOccurrenceMapper;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.ApplicationOccurrence;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.util.QueryUtil;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ApplicationOccurrenceService {
  private final JenaGraphRepository jenaGraphRepository;

  public List<ApplicationOccurrence> getAll() {
    return jenaGraphRepository.execSelect(
        QueryUtil.ApplicationOccurrence.GET_ALL_APPLICATIONS,
        ApplicationOccurrenceMapper.applicationMapper());
  }
}
