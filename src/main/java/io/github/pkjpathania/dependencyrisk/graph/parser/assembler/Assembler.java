package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import tools.jackson.databind.ObjectMapper;

public interface Assembler<T> {
  ObjectMapper mapper();

  T assemble();
}
