package io.github.pkjpathania.dependencyrisk.graph.controller;

import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationOverview;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationReferencesResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationSummary;
import io.github.pkjpathania.dependencyrisk.graph.model.ApplicationVulnerabilitiesResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactDetailResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.CveImpactListResponse;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencySummary;
import io.github.pkjpathania.dependencyrisk.graph.service.CveImpactService;
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
  private final CveImpactService cveImpactService;

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

  @GetMapping("/vulnerabilities")
  public ApplicationVulnerabilitiesResponse vulnerabilities(
      @RequestParam("applicationIri") String applicationIri) {
    return explorerService.getVulnerabilities(applicationIri);
  }

  @GetMapping("/references")
  public ApplicationReferencesResponse references(
      @RequestParam("applicationIri") String applicationIri) {
    return explorerService.getReferences(applicationIri);
  }

  @GetMapping("/cve-impact")
  public CveImpactListResponse cveImpact(
      @RequestParam(value = "scope", defaultValue = "selected") String scope,
      @RequestParam(value = "applicationIri", required = false) String applicationIri) {
    return cveImpactService.list(scope, applicationIri);
  }

  @GetMapping("/cve-impact/detail")
  public CveImpactDetailResponse cveImpactDetail(
      @RequestParam("vulnerabilityIri") String vulnerabilityIri,
      @RequestParam(value = "scope", defaultValue = "selected") String scope,
      @RequestParam(value = "applicationIri", required = false) String applicationIri) {
    return cveImpactService.detail(vulnerabilityIri, scope, applicationIri);
  }
}
