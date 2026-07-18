package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record CveImpactListResponse(
    String scope, String applicationIri, int total, List<CveImpactListItem> items) {
  public CveImpactListResponse {
    items = items == null ? List.of() : List.copyOf(items);
  }
}
