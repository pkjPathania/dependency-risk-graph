package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.cyclonedx.model.Bom;
import org.cyclonedx.model.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@RequiredArgsConstructor
public final class CycloneDxMetadataAssembler implements CycloneDxAssembler<ObjectNode> {

  private final Bom bom;
  private final ObjectMapper mapper;

  private void validateBom() {
    Objects.requireNonNull(bom(), "Bom cannot be null");
    Objects.requireNonNull(bom().getMetadata(), "CycloneDx metadata is missing");
    Objects.requireNonNull(
        bom().getMetadata().getComponent(), "CycloneDx metadata.component is missing");
    if (StringUtils.isBlank(bom().getMetadata().getComponent().getBomRef()))
      throw new IllegalArgumentException("metadata.component bom-ref is missing");
  }

  @Override
  public Bom bom() {
    return bom;
  }

  @Override
  public ObjectMapper mapper() {
    return mapper;
  }

  @Override
  public ObjectNode assemble() {
    ObjectNode node = mapper().createObjectNode();
    final Component component = bom().getMetadata().getComponent();
    validateBom();
    node.put("@id", component.getBomRef());
    node.put("@type", "risk:ApplicationOccurrence");
    CycloneDxAssemblerUtil.putIfNotBlank(node, "bomRef", component.getBomRef());
    CycloneDxAssemblerUtil.putIfNotBlank(node, "group", component.getGroup());
    CycloneDxAssemblerUtil.putIfNotBlank(node, "name", component.getName());
    CycloneDxAssemblerUtil.putIfNotBlank(node, "version", component.getVersion());
    CycloneDxAssemblerUtil.putIfNotBlank(node, "purl", component.getPurl());
    if (Objects.nonNull(component.getType())) {
      node.put("componentType", component.getType().getTypeName().toLowerCase());
    }

    return node;
  }
}
