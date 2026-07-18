package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

import java.time.Instant;

public record RdfImportContext(
    String importId,
    String declaredSpecVersion,
    String sourceFilename,
    String source,
    String contentSha256,
    Instant importedAt,
    String serialNumber) {}
