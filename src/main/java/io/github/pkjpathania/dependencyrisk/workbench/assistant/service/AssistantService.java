package io.github.pkjpathania.dependencyrisk.workbench.assistant.service;

import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.mapper.AssistantRdfMapper;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.model.ImpactedApplicationsResult;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.model.ImpactedServices;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.util.AssistantQueryUtil;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AssistantService {
  private final JenaGraphRepository repository;

  private List<ImpactedServices> findAllImpactedServices() {
    return repository.execSelect(
        AssistantQueryUtil.listImpactedServices(), AssistantRdfMapper.impactedServices());
  }

  public ImpactedApplicationsResult impactedServices() {
    return ImpactedApplicationsResult.from(findAllImpactedServices());
  }
}
