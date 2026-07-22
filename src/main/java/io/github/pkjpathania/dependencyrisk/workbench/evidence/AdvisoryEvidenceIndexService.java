package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdvisoryEvidenceIndexService {

  private final AdvisoryEvidenceSourceRepository sourceRepository;
  private final AdvisoryEvidenceDocumentFactory documentFactory;
  private final AdvisoryEvidenceIndex evidenceIndex;

  public List<AdvisoryEvidenceDocument> indexByIdentifier(String identifier) {

    String normalizedIdentifier = StringUtils.trimToNull(identifier);

    if (normalizedIdentifier == null) {
      throw new IllegalArgumentException("Vulnerability identifier must not be blank");
    }

    AdvisoryEvidenceSource source =
        sourceRepository
            .findByIdentifier(normalizedIdentifier)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "No advisory evidence found for identifier: " + normalizedIdentifier));

    List<AdvisoryEvidenceDocument> documents = documentFactory.create(source);

    evidenceIndex.replaceAll(documents);

    return documents;
  }

  public List<AdvisoryEvidenceMatch> search(String query, int maxResults, double minScore) {

    return evidenceIndex.search(query, maxResults, minScore);
  }

  public void clear() {
    evidenceIndex.clear();
  }

  public int count() {
    return evidenceIndex.count();
  }
}
