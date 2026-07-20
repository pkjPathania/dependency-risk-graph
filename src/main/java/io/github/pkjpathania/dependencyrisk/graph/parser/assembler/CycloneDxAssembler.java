package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import org.cyclonedx.model.Bom;

public interface CycloneDxAssembler<T> extends Assembler<T> {

  Bom bom();
}
