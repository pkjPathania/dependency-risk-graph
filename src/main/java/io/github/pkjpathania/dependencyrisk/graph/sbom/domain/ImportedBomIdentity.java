package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

import java.time.Instant;

public record ImportedBomIdentity(
    String importId,
    String serialNumber,
    String sourceFilename,
    String contentSha256,
    Instant importedAt) {}
