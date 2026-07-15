package io.github.pkjpathania.dependencyrisk.util;

import tools.jackson.databind.ObjectMapper;

public class GenUtil {
  private final ObjectMapper OM = new ObjectMapper();

  public String toJson(Object o) {
    return OM.writeValueAsString(o);
  }
}
