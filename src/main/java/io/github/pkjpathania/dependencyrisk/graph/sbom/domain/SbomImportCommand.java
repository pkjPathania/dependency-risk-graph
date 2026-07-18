package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

import java.time.Instant;
import java.util.Objects;

public record SbomImportCommand(
    byte[] content, String originalFilename, String source, Instant receivedAt) {
  public SbomImportCommand {
    Objects.requireNonNull(content, "content");
    Objects.requireNonNull(originalFilename, "originalFilename");
    Objects.requireNonNull(receivedAt, "receivedAt");
    if (content.length == 0) {
      throw new IllegalArgumentException("SBOM content must not be empty");
    }
    content = content.clone();
  }

  @Override
  public byte[] content() {
    return content.clone();
  }
}
