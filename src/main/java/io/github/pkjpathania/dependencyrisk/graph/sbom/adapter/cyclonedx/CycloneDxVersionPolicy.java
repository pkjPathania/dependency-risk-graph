package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.cyclonedx;

public interface CycloneDxVersionPolicy {
  CycloneDxSchemaVersion resolve(String declaredVersion);

  boolean isSupported(String declaredVersion);
}
