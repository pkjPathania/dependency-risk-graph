package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record CveImpactListResponse(
    String scope,
    String applicationIri,
    List<String> applicationIris,
    int total,
    List<CveImpactListItem> items) {
  public CveImpactListResponse {
    applicationIris = applicationIris == null ? List.of() : List.copyOf(applicationIris);
    items = items == null ? List.of() : List.copyOf(items);
  }

  public CveImpactListResponse(
      String scope, String applicationIri, int total, List<CveImpactListItem> items) {
    this(
        scope,
        applicationIri,
        applicationIri == null ? List.of() : List.of(applicationIri),
        total,
        items);
  }
}
