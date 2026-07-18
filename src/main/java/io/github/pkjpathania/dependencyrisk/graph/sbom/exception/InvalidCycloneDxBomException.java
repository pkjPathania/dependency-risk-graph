package io.github.pkjpathania.dependencyrisk.graph.sbom.exception;

public class InvalidCycloneDxBomException extends RuntimeException {
  public InvalidCycloneDxBomException(String message) {
    super(message);
  }

  public InvalidCycloneDxBomException(String message, Throwable cause) {
    super(message, cause);
  }
}
