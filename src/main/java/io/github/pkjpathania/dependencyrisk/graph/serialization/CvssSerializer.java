package io.github.pkjpathania.dependencyrisk.graph.serialization;

import io.github.pkjpathania.dependencyrisk.graph.util.CvssParserUtil;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ser.std.StdSerializer;
import us.springett.cvss.Cvss;
import us.springett.cvss.Score;

public final class CvssSerializer extends StdSerializer<Cvss> {

  public CvssSerializer() {
    super(Cvss.class);
  }

  @Override
  public void serialize(Cvss cvss, JsonGenerator generator, SerializationContext context)
      throws JacksonException {
    generator.writeStartObject();
    generator.writeStringProperty("implementation", cvss.getClass().getSimpleName());
    generator.writeStringProperty("name", cvss.getName());
    generator.writeStringProperty("vector", cvss.getVector());
    Score score = cvss.calculateScore();
    generator.writeStringProperty("severity", CvssParserUtil.severity(score.getBaseScore()));
    writeScore(generator, score);
    writeFields(generator, cvss);
    generator.writeEndObject();
  }

  private static void writeScore(JsonGenerator generator, Score score) throws JacksonException {
    generator.writeObjectPropertyStart("score");
    generator.writeNumberProperty("base", score.getBaseScore());
    generator.writeNumberProperty("impact", score.getImpactSubScore());
    generator.writeNumberProperty("exploitability", score.getExploitabilitySubScore());
    generator.writeNumberProperty("temporal", score.getTemporalScore());
    generator.writeNumberProperty("environmental", score.getEnvironmentalScore());
    generator.writeNumberProperty("modifiedImpact", score.getModifiedImpactSubScore());
    generator.writeEndObject();
  }

  private static void writeFields(JsonGenerator generator, Cvss cvss) throws JacksonException {
    for (Field field : fields(cvss.getClass())) {
      if (Modifier.isStatic(field.getModifiers()) || field.isSynthetic()) {
        continue;
      }
      try {
        field.setAccessible(true);
        Object value = field.get(cvss);
        if (value != null) {
          generator.writeStringProperty(field.getName(), value.toString());
        }
      } catch (IllegalAccessException exception) {
        throw new IllegalStateException(
            "Unable to serialize CVSS field " + field.getName(), exception);
      }
    }
  }

  private static List<Field> fields(Class<?> type) {
    List<Class<?>> hierarchy = new ArrayList<>();
    for (Class<?> current = type;
        current != null && Cvss.class.isAssignableFrom(current);
        current = current.getSuperclass()) {
      hierarchy.add(current);
    }
    Collections.reverse(hierarchy);
    return hierarchy.stream().flatMap(value -> List.of(value.getDeclaredFields()).stream()).toList();
  }
}
