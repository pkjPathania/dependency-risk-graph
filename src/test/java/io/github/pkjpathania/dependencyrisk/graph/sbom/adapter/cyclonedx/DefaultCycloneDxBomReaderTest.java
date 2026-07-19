package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.cyclonedx;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.InvalidCycloneDxBomException;
import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.UnsupportedCycloneDxVersionException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class DefaultCycloneDxBomReaderTest {
  private final DefaultCycloneDxBomReader reader =
      new DefaultCycloneDxBomReader(
          new ObjectMapper(), new DefaultCycloneDxVersionPolicy("12.2.0"));

  @Test
  void readsValidCycloneDx16IntoOfficialBom() {
    var result = reader.read(validBom().getBytes(StandardCharsets.UTF_8));

    assertEquals("1.6", result.declaredSpecVersion());
    assertEquals("root", result.bom().getMetadata().getComponent().getBomRef());
    assertEquals("urn:uuid:00000000-0000-4000-8000-000000000001", result.serialNumber());
  }

  @Test
  void readsCycloneDx17UsingCompatibilitySchema() {
    String json = validBom().replace("\"1.6\"", "\"1.7\"");

    var result = reader.read(json.getBytes(StandardCharsets.UTF_8));

    assertEquals("1.7", result.declaredSpecVersion());
    assertEquals("root", result.bom().getMetadata().getComponent().getBomRef());
  }

  @Test
  void validatesCycloneDx17UsingCompatibilitySchema() {
    String invalid =
        validBom().replace("\"1.6\"", "\"1.7\"").replace("\"name\":\"target\",", "");

    InvalidCycloneDxBomException exception =
        assertThrows(
            InvalidCycloneDxBomException.class,
            () -> reader.read(invalid.getBytes(StandardCharsets.UTF_8)));

    assertTrue(exception.getMessage().contains("CycloneDX 1.7 validation failed"));
  }

  @Test
  void rejectsInvalidBomFormat() {
    String json = validBom().replace("\"CycloneDX\"", "\"SPDX\"");
    InvalidCycloneDxBomException exception =
        assertThrows(
            InvalidCycloneDxBomException.class,
            () -> reader.read(json.getBytes(StandardCharsets.UTF_8)));
    assertTrue(exception.getMessage().contains("bomFormat"));
  }

  @Test
  void rejectsInvalidJsonWithCause() {
    InvalidCycloneDxBomException exception =
        assertThrows(
            InvalidCycloneDxBomException.class,
            () -> reader.read("{".getBytes(StandardCharsets.UTF_8)));
    assertNotNull(exception.getCause());
  }

  @Test
  void rejectsUnsupportedSpecVersionWithInstalledLibraryVersion() {
    String json = validBom().replace("\"1.6\"", "\"1.8\"");
    UnsupportedCycloneDxVersionException exception =
        assertThrows(
            UnsupportedCycloneDxVersionException.class,
            () -> reader.read(json.getBytes(StandardCharsets.UTF_8)));
    assertTrue(exception.getMessage().contains("12.2.0"));
    assertTrue(exception.getMessage().contains("1.2, 1.3, 1.4, 1.5, 1.6, 1.7"));
  }

  @Test
  void exposesMetadataComponentFromOfficialModel() {
    var result = reader.read(validBom().getBytes(StandardCharsets.UTF_8));
    assertEquals("root-name", result.bom().getMetadata().getComponent().getName());
  }

  @Test
  void reportsSchemaValidationFailure() {
    String invalid =
        validBom().replace("\"name\":\"target\",", "");
    InvalidCycloneDxBomException exception =
        assertThrows(
            InvalidCycloneDxBomException.class,
            () -> reader.read(invalid.getBytes(StandardCharsets.UTF_8)));
    assertTrue(exception.getMessage().contains("validation failed"));
  }

  private static String validBom() {
    return """
        {
          "bomFormat":"CycloneDX",
          "specVersion":"1.6",
          "serialNumber":"urn:uuid:00000000-0000-4000-8000-000000000001",
          "version":1,
          "metadata":{"component":{"type":"application","bom-ref":"root","name":"root-name","version":"1"}},
          "components":[{"type":"library","bom-ref":"target","name":"target","version":"2"}],
          "dependencies":[
            {"ref":"root","dependsOn":["target"]},
            {"ref":"target","dependsOn":[]}
          ]
        }
        """;
  }
}
