package io.github.pkjpathania.dependencyrisk.workbench.graphql.api;

import io.github.pkjpathania.dependencyrisk.workbench.annotations.GraphQlController;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.PackageOccurrence;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.service.PackageOccurrenceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;

@GraphQlController
@RequiredArgsConstructor
public class PackageOccurrenceQuery {
  private final PackageOccurrenceService packageOccurrenceService;

  @QueryMapping
  public List<PackageOccurrence> packageOccurrences() {
    return packageOccurrenceService.getAll();
  }

  @QueryMapping
  public PackageOccurrence packageOccurrence(@Argument String id) {
    return packageOccurrenceService.findById(id).orElse(null);
  }
}
