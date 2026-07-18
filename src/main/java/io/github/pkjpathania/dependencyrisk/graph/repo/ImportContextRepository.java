package io.github.pkjpathania.dependencyrisk.graph.repo;

import io.github.pkjpathania.dependencyrisk.graph.model.ImportContext;
import java.util.Optional;

public interface ImportContextRepository {
  Optional<ImportContext> findByImportId(String importId);

  Optional<ImportContext> findByApplicationId(String applicationId);

  Optional<ImportContext> findByRootOccurrenceIri(String rootOccurrenceIri);
}
