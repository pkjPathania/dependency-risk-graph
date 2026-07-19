package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import org.apache.commons.lang3.StringUtils;
import org.cyclonedx.model.Component;
import tools.jackson.databind.node.ObjectNode;

public class CycloneDxAssemblerUtil {
  public static void putIfNotBlank(ObjectNode node, String property, String value) {
    if (StringUtils.isNotBlank(value)) node.put(property, value);
  }

  public static String rdfType(Component component) {
    return switch (component.getType()) {
      case APPLICATION -> "risk:ApplicationOccurrence";
      case LIBRARY -> "risk:PackageOccurrence";

      default -> throw new IllegalArgumentException("Unsupported type " + component.getType());
    };
  }
}
