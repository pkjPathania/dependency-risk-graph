package io.github.pkjpathania.dependencyrisk.graph.model;

import io.github.pkjpathania.dependencyrisk.graph.serialization.CvssSerializer;
import java.util.Objects;
import tools.jackson.databind.annotation.JsonSerialize;
import us.springett.cvss.Cvss;

public record CvssAssessmentView(
    String iri, String type, @JsonSerialize(using = CvssSerializer.class) Cvss cvss) {

  @Override
  public boolean equals(Object value) {
    return value instanceof CvssAssessmentView other
        && Objects.equals(iri, other.iri)
        && Objects.equals(type, other.type)
        && Objects.equals(cvss.getVector(), other.cvss.getVector());
  }

  @Override
  public int hashCode() {
    return Objects.hash(iri, type, cvss.getVector());
  }
}
