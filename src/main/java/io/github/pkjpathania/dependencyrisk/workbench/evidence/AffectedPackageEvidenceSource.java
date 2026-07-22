package io.github.pkjpathania.dependencyrisk.workbench.evidence;

public record AffectedPackageEvidenceSource(
    String iri, String name, String purl, String ecosystem, String sourceUrl) {

  public AffectedPackageEvidenceSource {
    iri = requireText(iri, "iri");
    name = normalize(name);
    purl = normalize(purl);
    ecosystem = normalize(ecosystem);
    sourceUrl = normalize(sourceUrl);
  }

  private static String requireText(String value, String fieldName) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(fieldName + " must not be blank");
    }

    return value.trim();
  }

  private static String normalize(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value.trim();
  }
}
