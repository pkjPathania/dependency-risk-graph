package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record ApplicationVulnerabilitiesResponse(
    String applicationIri, int total, List<ApplicationVulnerabilityItem> items) {

  public ApplicationVulnerabilitiesResponse {
    items = items == null ? List.of() : List.copyOf(items);
  }
}
