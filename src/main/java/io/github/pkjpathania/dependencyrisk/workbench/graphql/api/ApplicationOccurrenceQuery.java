package io.github.pkjpathania.dependencyrisk.workbench.graphql.api;

import io.github.pkjpathania.dependencyrisk.workbench.annotations.GraphQlController;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.ApplicationOccurrence;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.service.ApplicationOccurrenceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.QueryMapping;

@GraphQlController
@RequiredArgsConstructor
public class ApplicationOccurrenceQuery {

  private final ApplicationOccurrenceService applicationOccurrenceService;

  @QueryMapping
  public List<ApplicationOccurrence> applicationOccurrences() {
    return applicationOccurrenceService.getAll();
  }
}
