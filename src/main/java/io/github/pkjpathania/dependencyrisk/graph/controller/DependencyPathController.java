package io.github.pkjpathania.dependencyrisk.graph.controller;

import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathResult;
import io.github.pkjpathania.dependencyrisk.graph.service.DependencyPathResolver;
import io.github.pkjpathania.dependencyrisk.graph.repo.ImportContextRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dependencies")
@RequiredArgsConstructor
public class DependencyPathController {

  private final DependencyPathResolver pathResolver;
  private final ImportContextRepository importContextRepository;

  @GetMapping("/path")
  public DependencyPathResult path(
      @RequestParam String importId,
      @RequestParam String targetPackageVersionIri) {
    return importContextRepository.findByImportId(importId)
        .map(context -> pathResolver.resolve(context, targetPackageVersionIri))
        .orElseGet(() -> DependencyPathResult.importNotFound(importId, targetPackageVersionIri));
  }
}
