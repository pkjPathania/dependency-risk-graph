package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import org.cyclonedx.model.Bom;
import tools.jackson.databind.ObjectMapper;

public interface CycloneDxAssembler<T> {

  Bom bom();

  ObjectMapper mapper();

  T assemble();
}
