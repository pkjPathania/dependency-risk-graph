package io.github.pkjpathania.dependencyrisk.graph.controller;

import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathResult;
import io.github.pkjpathania.dependencyrisk.graph.service.DependencyPathService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dependencies")
@RequiredArgsConstructor
public class DependencyPathController {

  private final DependencyPathService pathService;

  @GetMapping("/path")
  public DependencyPathResult path(
      @RequestParam String packageName, @RequestParam(required = false) String version) {
    return pathService.shortest(packageName, version);
  }
}
