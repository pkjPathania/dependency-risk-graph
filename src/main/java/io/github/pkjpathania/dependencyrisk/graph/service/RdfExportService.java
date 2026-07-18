package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.GraphMetadata;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RdfExportService {
  private final JenaGraphRepository jenaGraphRepository;

  public GraphMetadata getSummary() {
    return jenaGraphRepository.getMetadata();
  }
}
