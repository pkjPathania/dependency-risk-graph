package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.util.GenUtil;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.cyclonedx.model.Bom;
import org.cyclonedx.model.BomReference;
import org.cyclonedx.model.Composition;
import org.springframework.stereotype.Component;

@Component
public final class CompositionMapper {
  private static final String RESOURCE_NS =
      "urn:io.github.pkjpathania.dependencyrisk:resource:composition:";

  public Map<Composition, Resource> register(Bom bom, RdfMappingContext context) {
    Map<Composition, Resource> resources = new IdentityHashMap<>();
    int index = 0;
    for (Composition composition : safe(bom.getCompositions())) {
      String key =
          context.importContext().importId()
              + "\u0000"
              + index++
              + "\u0000"
              + composition.getBomRef();
      Resource resource =
          context.model().createResource(RESOURCE_NS + GenUtil.sha256(key));
      resource.addProperty(RDF.type, RiskVocabulary.COMPOSITION);
      resource.addProperty(RiskVocabulary.BELONGS_TO_IMPORT, context.importResource());
      if (composition.getAggregate() != null) {
        resource.addProperty(
            RiskVocabulary.COMPOSITION_AGGREGATE, composition.getAggregate().name());
      }
      context.registerResource(composition.getBomRef(), resource);
      resources.put(composition, resource);
    }
    return resources;
  }

  public void mapRelationships(
      Bom bom,
      RdfMappingContext context,
      Resource document,
      Map<Composition, Resource> resources) {
    for (Composition composition : safe(bom.getCompositions())) {
      Resource compositionResource = resources.get(composition);
      context.model().add(document, RiskVocabulary.HAS_COMPOSITION, compositionResource);
      for (BomReference assembly : safe(composition.getAssemblies())) {
        context
            .findOccurrenceByBomRef(assembly.getRef())
            .ifPresent(
                resource ->
                    context
                        .model()
                        .add(compositionResource, RiskVocabulary.HAS_ASSEMBLY, resource));
      }
    }
  }

  private static <T> List<T> safe(List<T> values) {
    return values == null ? List.of() : values;
  }
}
