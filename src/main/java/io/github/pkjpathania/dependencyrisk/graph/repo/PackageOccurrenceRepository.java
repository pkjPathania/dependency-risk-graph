package io.github.pkjpathania.dependencyrisk.graph.repo;

import java.util.List;

public interface PackageOccurrenceRepository {
  List<String> findOccurrences(String importRunIri, String packageVersionIri);

  boolean occurrenceExistsInImport(String importRunIri, String occurrenceIri);
}
