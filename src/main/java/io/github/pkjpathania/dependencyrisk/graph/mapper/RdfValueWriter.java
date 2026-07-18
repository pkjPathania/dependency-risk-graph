package io.github.pkjpathania.dependencyrisk.graph.mapper;

import java.time.Instant;
import java.util.Collection;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.datatypes.xsd.XSDDatatype;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Resource;
import org.springframework.util.CollectionUtils;

public final class RdfValueWriter {

  private RdfValueWriter() {}

  public static void replaceLiteral(
      Model model, Resource subject, Property property, String value) {
    model.removeAll(subject, property, null);
    if (StringUtils.isNotBlank(value)) {
      model.add(subject, property, value.trim());
    }
  }

  public static void replaceLiterals(
      Model model, Resource subject, Property property, Collection<String> values) {
    model.removeAll(subject, property, null);
    if (CollectionUtils.isEmpty(values)) return;

    values.stream()
        .filter(StringUtils::isNotBlank)
        .map(String::trim)
        .distinct()
        .forEach(value -> model.add(subject, property, value));
  }

  public static void replaceDateTime(
      Model model,
      Resource subject,
      Property property,
      Instant value) {

    model.removeAll(subject, property, null);

    if (value == null) {
      return;
    }

    model.add(
        subject,
        property,
        model.createTypedLiteral(
            value.toString(),
            XSDDatatype.XSDdateTime));
  }
}
