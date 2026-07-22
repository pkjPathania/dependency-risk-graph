package io.github.pkjpathania.dependencyrisk.workbench.api;

import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceDocument;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceIndexService;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceMatch;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceSource;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceSourceRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workbench/evidence")
@RequiredArgsConstructor
public class AdvisoryEvidenceController {

  private final AdvisoryEvidenceSourceRepository sourceRepository;
  private final AdvisoryEvidenceIndexService indexService;

  @GetMapping("/source/{identifier}")
  public ResponseEntity<AdvisoryEvidenceSource> source(@PathVariable String identifier) {

    return sourceRepository
        .findByIdentifier(identifier)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping("/index/{identifier}")
  public List<AdvisoryEvidenceDocument> index(@PathVariable String identifier) {

    return indexService.indexByIdentifier(identifier);
  }

  @PostMapping("/search")
  public List<AdvisoryEvidenceMatch> search(@RequestBody AdvisoryEvidenceSearchRequest request) {

    return indexService.search(
        request.query(), request.resolvedMaxResults(), request.resolvedMinScore());
  }
}
