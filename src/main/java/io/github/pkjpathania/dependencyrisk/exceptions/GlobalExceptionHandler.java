package io.github.pkjpathania.dependencyrisk.exceptions;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import io.github.pkjpathania.dependencyrisk.vulnerability.exception.OsvDisabledException;
import io.github.pkjpathania.dependencyrisk.vulnerability.exception.OsvSnapshotWriteException;
import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.CycloneDxMappingException;
import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.InvalidCycloneDxBomException;
import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.SbomPersistenceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static List<String> detailsFor(Exception exception) {
    List<String> details = new ArrayList<>();
    details.add("Exception: " + exception.getClass().getSimpleName());
    String causeMessage = exception.getCause() != null ? exception.getCause().getMessage() : null;
    if (causeMessage != null && !causeMessage.isBlank()) {
      details.add("Cause: " + causeMessage);
    }

    return List.copyOf(details);
  }

  private static String describeFieldError(FieldError fieldError) {
    if (fieldError == null) {
      return null;
    }

    String objectName = fieldError.getObjectName();
    String fieldName = fieldError.getField();
    String defaultMessage = fieldError.getDefaultMessage();
    return objectName + "." + fieldName + ": " + (defaultMessage != null ? defaultMessage : "invalid value");
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
      IllegalArgumentException exception, HttpServletRequest request) {
    return buildResponse(
        HttpStatus.BAD_REQUEST,
        "Bad Request",
        exception.getMessage(),
        detailsFor(exception),
        request);
  }

  @ExceptionHandler(InvalidCycloneDxBomException.class)
  public ResponseEntity<ApiErrorResponse> handleInvalidCycloneDx(
      InvalidCycloneDxBomException exception, HttpServletRequest request) {
    return buildResponse(
        HttpStatus.BAD_REQUEST,
        "Invalid CycloneDX BOM",
        exception.getMessage(),
        detailsFor(exception),
        request);
  }

  @ExceptionHandler({CycloneDxMappingException.class, SbomPersistenceException.class})
  public ResponseEntity<ApiErrorResponse> handleSbomImportFailure(
      RuntimeException exception, HttpServletRequest request) {
    log.error("SBOM import failed for {}", request.getRequestURI(), exception);
    return buildResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "SBOM Import Failed",
        exception.getMessage(),
        detailsFor(exception),
        request);
  }

  @ExceptionHandler(NoSuchElementException.class)
  public ResponseEntity<ApiErrorResponse> handleNotFound(
      NoSuchElementException exception, HttpServletRequest request) {
    return buildResponse(
        HttpStatus.NOT_FOUND,
        "Not Found",
        exception.getMessage(),
        detailsFor(exception),
        request);
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ApiErrorResponse> handleIllegalState(
      IllegalStateException exception, HttpServletRequest request) {
    return buildResponse(
        HttpStatus.BAD_REQUEST,
        "Bad Request",
        exception.getMessage(),
        detailsFor(exception),
        request);
  }

  @ExceptionHandler(OsvDisabledException.class)
  public ResponseEntity<ApiErrorResponse> handleOsvDisabled(
      OsvDisabledException exception, HttpServletRequest request) {
    return buildResponse(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Service Unavailable",
        exception.getMessage(),
        detailsFor(exception),
        request);
  }

  @ExceptionHandler(OsvSnapshotWriteException.class)
  public ResponseEntity<ApiErrorResponse> handleOsvSnapshotWriteFailure(
      OsvSnapshotWriteException exception, HttpServletRequest request) {
    return buildResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Internal Server Error",
        exception.getMessage(),
        detailsFor(exception),
        request);
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleMissingResource(
      NoResourceFoundException exception, HttpServletRequest request) {
    return buildResponse(
        HttpStatus.NOT_FOUND,
        "Not Found",
        "Resource not found",
        List.of(),
        request);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidationFailure(
      MethodArgumentNotValidException exception, HttpServletRequest request) {
    List<String> details =
        exception.getBindingResult().getFieldErrors().stream()
            .map(GlobalExceptionHandler::describeFieldError)
            .filter(Objects::nonNull)
            .toList();

    return buildResponse(
        HttpStatus.BAD_REQUEST, "Bad Request", "Validation failed", details, request);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleUnexpected(
      Exception exception, HttpServletRequest request) {
    log.error("Unhandled exception while processing {}", request.getRequestURI(), exception);
    return buildResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Internal Server Error",
        "An unexpected error occurred",
        detailsFor(exception),
        request);
  }

  private ResponseEntity<ApiErrorResponse> buildResponse(
      HttpStatus status,
      String error,
      String message,
      List<String> details,
      HttpServletRequest request) {
    ApiErrorResponse payload =
        new ApiErrorResponse(
            Instant.now(),
            status.value(),
            error,
            message,
            details,
            request.getRequestURI());

    return ResponseEntity.status(status).body(payload);
  }
}
