package io.github.pkjpathania.dependencyrisk.graph.sbom.exception;

public final class SbomPersistenceException extends RuntimeException {
  public SbomPersistenceException(String message, Throwable cause) {
    super(message, cause);
  }
}
