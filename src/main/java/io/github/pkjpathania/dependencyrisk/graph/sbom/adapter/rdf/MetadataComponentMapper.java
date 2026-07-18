package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import org.apache.jena.rdf.model.Resource;
import java.util.Optional;
import org.cyclonedx.model.Component;

@org.springframework.stereotype.Component
public final class MetadataComponentMapper {
  private final ComponentMapper componentMapper;

  public MetadataComponentMapper(ComponentMapper componentMapper) {
    this.componentMapper = componentMapper;
  }

  public void map(Component component, Resource resource, Optional<Resource> canonicalPackage) {
    componentMapper.map(component, resource, canonicalPackage, true);
  }
}
