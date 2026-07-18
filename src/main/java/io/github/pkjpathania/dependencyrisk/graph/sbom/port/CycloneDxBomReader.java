package io.github.pkjpathania.dependencyrisk.graph.sbom.port;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.CycloneDxReadResult;

/** Adapter boundary for official CycloneDX parsing and version-aware validation. */
public interface CycloneDxBomReader {
  CycloneDxReadResult read(byte[] content);
}
