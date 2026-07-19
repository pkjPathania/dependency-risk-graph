package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.cyclonedx.model.Bom;
import org.cyclonedx.model.Dependency;
import org.springframework.util.CollectionUtils;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@RequiredArgsConstructor
public class CycloneDxDependencyAssembler implements CycloneDxAssembler<List<ObjectNode>> {

  private final Bom bom;
  private final ObjectMapper mapper;

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
    if (CollectionUtils.isEmpty(bom().getDependencies())) {
      return List.of();
    }

    List<ObjectNode> nodes = new ArrayList<>();

    for (Dependency dependency : bom().getDependencies()) {
      String parentRef = dependency.getRef();

      if (StringUtils.isBlank(parentRef) || CollectionUtils.isEmpty(dependency.getDependencies())) {
        continue;
      }

      ObjectNode relationshipNode = mapper().createObjectNode();
      relationshipNode.put("@id", parentRef);

      ArrayNode dependsOn = relationshipNode.putArray("dependsOn");

      Set<String> processedChildren = new LinkedHashSet<>();

      for (Dependency child : dependency.getDependencies()) {
        String childRef = child.getRef();

        if (StringUtils.isBlank(childRef)) {
          continue;
        }

        if (!processedChildren.add(childRef)) {
          continue;
        }

        dependsOn.add(childRef);
      }

      if (!dependsOn.isEmpty()) {
        nodes.add(relationshipNode);
      }
    }

    return List.copyOf(nodes);
  }
}
