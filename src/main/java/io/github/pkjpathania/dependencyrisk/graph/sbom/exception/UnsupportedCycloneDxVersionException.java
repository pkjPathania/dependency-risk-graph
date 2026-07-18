package io.github.pkjpathania.dependencyrisk.graph.sbom.exception;

public final class UnsupportedCycloneDxVersionException extends InvalidCycloneDxBomException {
  public UnsupportedCycloneDxVersionException(String message) {
    super(message);
  }
}
