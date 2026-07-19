package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.cyclonedx.model.Bom;
import org.cyclonedx.model.Component;
import org.cyclonedx.model.Component.Type;
import org.springframework.util.CollectionUtils;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@RequiredArgsConstructor
public class CycloneDxComponentAssembler implements CycloneDxAssembler<List<ObjectNode>> {
  private final Bom bom;
  private final ObjectMapper mapper;

  private boolean isSupportedComponent(Component component) {
    return Type.APPLICATION.equals(component.getType()) || Type.LIBRARY.equals(component.getType());
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
  public List<ObjectNode> assemble() {
    if (CollectionUtils.isEmpty(bom.getComponents())) return List.of();
    Deque<Component> pending = new ArrayDeque<>(bom.getComponents());

    List<ObjectNode> nodes = new ArrayList<>();
    Set<String> processedBomRefs = new LinkedHashSet<>();

    while (!pending.isEmpty()) {
      Component component = pending.removeFirst();

      if (!CollectionUtils.isEmpty(component.getComponents())) {
        pending.addAll(component.getComponents());
      }
      if (!isSupportedComponent(component)) continue;
      String bomRef = component.getBomRef();
      if (StringUtils.isBlank(bomRef)) continue;

      if (!processedBomRefs.add(bomRef)) continue;

      nodes.add(toJsonLdNode(component));
    }
    return List.copyOf(nodes);
  }

  private ObjectNode toJsonLdNode(Component component) {
    ObjectNode node = mapper().createObjectNode();

    node.put("@id", component.getBomRef());
    node.put("@type", CycloneDxAssemblerUtil.rdfType(component));
    CycloneDxAssemblerUtil.putIfNotBlank(node, "bomRef", component.getBomRef());
    CycloneDxAssemblerUtil.putIfNotBlank(node, "group", component.getGroup());
    CycloneDxAssemblerUtil.putIfNotBlank(node, "name", component.getName());
    CycloneDxAssemblerUtil.putIfNotBlank(node, "version", component.getVersion());
    CycloneDxAssemblerUtil.putIfNotBlank(node, "purl", component.getPurl());
    node.put("componentType", component.getType().name().toLowerCase(Locale.ROOT));

    return node;
  }
}
