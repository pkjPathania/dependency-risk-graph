package io.github.pkjpathania.dependencyrisk.workbench.api;

public record AdvisoryEvidenceSearchRequest(
    String query,
    Integer maxResults,
    Double minScore) {

  public int resolvedMaxResults() {
    return maxResults == null ? 2 : maxResults;
  }

  public double resolvedMinScore() {
    return minScore == null ? 0.0 : minScore;
  }
}