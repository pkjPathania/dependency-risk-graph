package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.cyclonedx;

import org.cyclonedx.Version;

public record CycloneDxSchemaVersion(String declaredVersion, Version libraryVersion) {}
