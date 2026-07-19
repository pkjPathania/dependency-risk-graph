package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.cyclonedx;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.CycloneDxReadResult;
import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.InvalidCycloneDxBomException;
import io.github.pkjpathania.dependencyrisk.graph.sbom.port.CycloneDxBomReader;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import org.cyclonedx.exception.ParseException;
import org.cyclonedx.model.Bom;
import org.cyclonedx.parsers.BomParserFactory;
import org.cyclonedx.parsers.Parser;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Component
public final class DefaultCycloneDxBomReader implements CycloneDxBomReader {
  private final ObjectMapper objectMapper;
  private final CycloneDxVersionPolicy versionPolicy;

  public DefaultCycloneDxBomReader(
      ObjectMapper objectMapper, CycloneDxVersionPolicy versionPolicy) {
    this.objectMapper = objectMapper;
    this.versionPolicy = versionPolicy;
  }

  @Override
  public CycloneDxReadResult read(byte[] content) {
    Objects.requireNonNull(content, "content");
    Header header = readHeader(content);
    CycloneDxSchemaVersion schemaVersion = versionPolicy.resolve(header.specVersion());
    try {
      Parser parser = BomParserFactory.createParser(content);
      List<ParseException> validationErrors =
          parser.validate(
              contentForValidation(content, schemaVersion), schemaVersion.libraryVersion());
      if (!validationErrors.isEmpty()) {
        String details =
            validationErrors.stream()
                .map(Throwable::getMessage)
                .filter(Objects::nonNull)
                .limit(5)
                .collect(java.util.stream.Collectors.joining("; "));
        throw new InvalidCycloneDxBomException(
            "CycloneDX " + header.specVersion() + " validation failed: " + details);
      }
      Bom bom = parser.parse(content);
      return new CycloneDxReadResult(
          bom, header.specVersion(), bom.getSerialNumber(), List.of());
    } catch (IOException | ParseException exception) {
      throw new InvalidCycloneDxBomException(
          "Unable to validate or parse CycloneDX " + header.specVersion() + " document",
          exception);
    }
  }

  private byte[] contentForValidation(byte[] content, CycloneDxSchemaVersion schemaVersion) {
    if (schemaVersion
        .declaredVersion()
        .equals(schemaVersion.libraryVersion().getVersionString())) {
      return content;
    }
    JsonNode root = objectMapper.readTree(content);
    if (!(root instanceof ObjectNode objectRoot)) {
      throw new InvalidCycloneDxBomException("CycloneDX JSON document must be an object");
    }
    objectRoot.put("specVersion", schemaVersion.libraryVersion().getVersionString());
    return objectMapper.writeValueAsBytes(objectRoot);
  }

  private Header readHeader(byte[] content) {
    try {
      JsonNode root = objectMapper.readTree(content);
      String bomFormat = root.path("bomFormat").asString(null);
      String specVersion = root.path("specVersion").asString(null);
      if (!"CycloneDX".equals(bomFormat)) {
        throw new InvalidCycloneDxBomException(
            "Expected bomFormat 'CycloneDX' but found '" + bomFormat + "'");
      }
      if (specVersion == null || specVersion.isBlank()) {
        throw new InvalidCycloneDxBomException("CycloneDX specVersion is required");
      }
      return new Header(specVersion);
    } catch (InvalidCycloneDxBomException exception) {
      throw exception;
    } catch (RuntimeException exception) {
      throw new InvalidCycloneDxBomException("Invalid CycloneDX JSON document", exception);
    }
  }

  private record Header(String specVersion) {}
}
