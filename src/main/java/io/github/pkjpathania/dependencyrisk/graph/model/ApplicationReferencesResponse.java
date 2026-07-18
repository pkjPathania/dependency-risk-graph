package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record ApplicationReferencesResponse(
    String applicationIri, int total, List<AdvisoryReferenceItem> items) {

  public ApplicationReferencesResponse {
    items = items == null ? List.of() : List.copyOf(items);
  }
}
