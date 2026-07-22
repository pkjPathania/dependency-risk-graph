package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import java.util.List;
import java.util.Optional;

public interface AdvisoryEvidenceSourceRepository {

  Optional<AdvisoryEvidenceSource> findByIdentifier(String identifier);

  List<AdvisoryEvidenceSource> findAll();

  List<String> findAllIdentifiers();
}
