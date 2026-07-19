package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import io.github.pkjpathania.dependencyrisk.graph.parser.config.JsonLdProperties;
import java.util.List;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.cyclonedx.model.Bom;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@RequiredArgsConstructor
public abstract class CycloneDxJsonLdAssembler {

  private final ObjectMapper objectMapper;

  private final JsonLdProperties properties;

  protected ObjectNode createDocument() {
    ObjectNode document = objectMapper.createObjectNode();
    document.set("@context", objectMapper.valueToTree(properties.context()));
    document.putArray("@graph");
    return document;
  }

  protected ObjectNode assemble(Bom bom) {
    ObjectNode document = createDocument();
    ArrayNode graph = graph(document);
    graph.add(newMetatada().apply(bom));
    components().apply(bom).forEach(graph::add);
    dependencies().apply(bom).forEach(graph::add);
    return document;
  }

  private Function<Bom, List<ObjectNode>> dependencies() {
    return bom -> new CycloneDxDependencyAssembler(bom, objectMapper()).assemble();
  }

  private Function<Bom, ObjectNode> newMetatada() {
    return bom -> new CycloneDxMetadataAssembler(bom, objectMapper).assemble();
  }

  private Function<Bom, List<ObjectNode>> components() {
    return bom -> new CycloneDxComponentAssembler(bom, objectMapper()).assemble();
  }

  protected final ArrayNode graph(ObjectNode document) {
    return document.withArray("@graph");
  }

  protected final ObjectMapper objectMapper() {
    return objectMapper;
  }
}
