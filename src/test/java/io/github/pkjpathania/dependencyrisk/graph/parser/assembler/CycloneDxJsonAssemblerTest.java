package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.github.pkjpathania.dependencyrisk.graph.parser.config.JsonLdProperties;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.service.SparqlService;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.apache.jena.query.DatasetFactory;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class CycloneDxJsonAssemblerTest {

  @Test
  void assemblesAndPersistsGraph() {
    ObjectMapper objectMapper = new ObjectMapper();
    JenaGraphRepository repository =
        new JenaGraphRepository(DatasetFactory.createTxnMem(), objectMapper);
    JsonLdProperties properties =
        new JsonLdProperties(
            Map.of(
                "risk", "urn:io-github-pkjpathania:dependency-risk-graph:schema:",
                "name", "risk:name",
                "version", "risk:version",
                "purl", "risk:purl",
                "bomRef", "risk:bomRef",
                "componentType", "risk:componentType",
                "dependsOn", Map.of("@id", "risk:dependsOn", "@type", "@id")));
    CycloneDxJsonAssembler assembler =
        new CycloneDxJsonAssembler(repository, objectMapper, properties);

    assembler.save(validBom().getBytes(StandardCharsets.UTF_8));
    var metadata = repository.getMetadata();

    assertEquals(1, metadata.summary().applicationCount());
    assertEquals(1, metadata.summary().packageCount());
    assertEquals(1, metadata.summary().dependencyEdgeCount());
    assertEquals("root", new SparqlService(repository, objectMapper).getSummaries().getFirst().name());
  }

  private static String validBom() {
    return """
        {
          "bomFormat":"CycloneDX",
          "specVersion":"1.6",
          "serialNumber":"urn:uuid:00000000-0000-4000-8000-000000000001",
          "version":1,
          "metadata":{"component":{"type":"application","bom-ref":"urn:test:root","name":"root","version":"1"}},
          "components":[{"type":"library","bom-ref":"urn:test:target","name":"target","version":"2","purl":"pkg:maven/example/target@2"}],
          "dependencies":[
            {"ref":"urn:test:root","dependsOn":["urn:test:target"]},
            {"ref":"urn:test:target","dependsOn":[]}
          ]
        }
        """;
  }
}
