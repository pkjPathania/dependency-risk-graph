package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

import java.util.List;
import java.util.Objects;
import org.cyclonedx.model.Bom;

public record CycloneDxReadResult(
    Bom bom, String declaredSpecVersion, String serialNumber, List<ImportIssue> issues) {
  public CycloneDxReadResult {
    Objects.requireNonNull(bom, "bom");
    Objects.requireNonNull(declaredSpecVersion, "declaredSpecVersion");
    issues = List.copyOf(issues);
  }
}
