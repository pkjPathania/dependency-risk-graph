package io.github.pkjpathania.dependencyrisk.graph.sbom.exception;

public final class CycloneDxMappingException extends RuntimeException {
  public CycloneDxMappingException(String message, Throwable cause) {
    super(message, cause);
  }
}
