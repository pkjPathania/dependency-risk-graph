package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import static io.github.pkjpathania.dependencyrisk.workbench.evidence.VectorMetadataKeys.DOCUMENT_ID;
import static io.github.pkjpathania.dependencyrisk.workbench.evidence.VectorMetadataKeys.SEGMENT_TYPE;
import static io.github.pkjpathania.dependencyrisk.workbench.evidence.VectorMetadataKeys.VULNERABILITY_ID;

import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class AdvisoryEvidenceIndex {

  private static final String QUERY_PREFIX =
      "Represent this sentence for searching relevant passages: ";

  private final EmbeddingModel embeddingModel;
  private final EmbeddingStore<TextSegment> embeddingStore;

  private final ReadWriteLock storeLock = new ReentrantReadWriteLock();

  private final AtomicInteger indexedDocumentCount = new AtomicInteger();

  public AdvisoryEvidenceIndex(
      @Qualifier("embeddingModel") EmbeddingModel embeddingModel,
      @Qualifier("advisoryEmbeddingStore") EmbeddingStore<TextSegment> embeddingStore) {
    this.embeddingModel = embeddingModel;
    this.embeddingStore = embeddingStore;
  }

  private static TextSegment toTextSegment(AdvisoryEvidenceDocument document) {
    Metadata metadata =
        Metadata.from(
            Map.of(
                DOCUMENT_ID,
                document.id(),
                VULNERABILITY_ID,
                document.vulnerabilityId(),
                SEGMENT_TYPE,
                document.segmentType().name()));

    return TextSegment.from(document.text(), metadata);
  }

  private static List<AdvisoryEvidenceDocument> validateDocuments(
      List<AdvisoryEvidenceDocument> documents) {

    if (documents == null || documents.isEmpty()) {
      throw new IllegalArgumentException("documents must not be empty");
    }

    Set<String> documentIds = new HashSet<>();

    for (AdvisoryEvidenceDocument document : documents) {
      if (document == null) {
        throw new IllegalArgumentException("documents must not contain null values");
      }

      if (!documentIds.add(document.id())) {
        throw new IllegalArgumentException(
            "Duplicate advisory evidence document ID: " + document.id());
      }
    }

    return List.copyOf(documents);
  }

  private static String requireQuery(String query) {
    if (StringUtils.isBlank(query)) {
      throw new IllegalArgumentException("query must not be empty");
    }

    return query.trim();
  }

  private static void validateSearchOptions(int maxResults, double minScore) {
    if (maxResults < 1) {
      throw new IllegalArgumentException("maxResults must be greater than 0");
    }

    if (minScore < 0.0 || minScore > 1.0) {
      throw new IllegalArgumentException("minScore must be between 0 and 1");
    }
  }

  public int replaceAll(List<AdvisoryEvidenceDocument> documents) {
    List<AdvisoryEvidenceDocument> validated = validateDocuments(documents);

    List<String> ids = validated.stream().map(AdvisoryEvidenceDocument::id).toList();

    List<TextSegment> segments =
        validated.stream().map(AdvisoryEvidenceIndex::toTextSegment).toList();

    /*
     * Generate embeddings before taking the write lock.
     *
     * Search operations can continue while the expensive model
     * operation is running.
     */
    List<Embedding> embeddings = embeddingModel.embedAll(segments).content();

    if (embeddings.size() != segments.size()) {
      throw new IllegalStateException(
          "Embedding model returned %d embeddings for %d segments"
              .formatted(embeddings.size(), segments.size()));
    }

    storeLock.writeLock().lock();

    try {
      embeddingStore.removeAll();
      embeddingStore.addAll(ids, embeddings, segments);

      indexedDocumentCount.set(validated.size());

      return validated.size();
    } finally {
      storeLock.writeLock().unlock();
    }
  }

  public List<AdvisoryEvidenceMatch> search(String query, int maxResults, double minScore) {
    String normalizedQuery = requireQuery(query);

    validateSearchOptions(maxResults, minScore);

    Embedding queryEmbedding = embeddingModel.embed(QUERY_PREFIX + normalizedQuery).content();

    EmbeddingSearchRequest request =
        EmbeddingSearchRequest.builder()
            .queryEmbedding(queryEmbedding)
            .maxResults(maxResults)
            .minScore(minScore)
            .build();

    storeLock.readLock().lock();

    try {
      return embeddingStore.search(request).matches().stream()
          .map(
              match -> {
                TextSegment segment = match.embedded();
                Metadata metadata = segment.metadata();

                return new AdvisoryEvidenceMatch(
                    metadata.getString(DOCUMENT_ID),
                    metadata.getString(VULNERABILITY_ID),
                    AdvisoryEvidenceSegmentType.valueOf(metadata.getString(SEGMENT_TYPE)),
                    match.score(),
                    segment.text());
              })
          .toList();
    } finally {
      // Important: release the same lock that was acquired.
      storeLock.readLock().unlock();
    }
  }

  public void clear() {
    storeLock.writeLock().lock();

    try {
      embeddingStore.removeAll();
      indexedDocumentCount.set(0);
    } finally {
      storeLock.writeLock().unlock();
    }
  }

  public int count() {
    return indexedDocumentCount.get();
  }
}
