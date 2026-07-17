package io.github.pkjpathania.dependencyrisk.graph.controller;

import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationOverview;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationSummary;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencySummary;
import io.github.pkjpathania.dependencyrisk.graph.service.ExplorerService;
import io.github.pkjpathania.dependencyrisk.graph.service.SparqlService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/v1/explore", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class ExploreController {

  private final SparqlService sparqlService;
  private final ExplorerService explorerService;

  @GetMapping("/applications")
  public List<ApplicationSummary> applications() {
    return sparqlService.getSummaries();
  }

  @GetMapping("/overview")
  public ApplicationOverview overview(@RequestParam("applicationIri") String applicationIri) {
    return explorerService.overview(applicationIri);
  }

  @GetMapping("/dependencies")
  public List<DependencySummary> dependencies(
      @RequestParam("applicationIri") String applicationIri) {
    return explorerService.dependencySummary(applicationIri);
  }
}
