package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.util.List;
import java.util.Optional;
import org.apache.jena.rdf.model.Resource;
import org.cyclonedx.model.Bom;
import org.cyclonedx.model.Dependency;
import org.springframework.stereotype.Component;

@Component
public final class DependencyMapper {
  public void map(Bom bom, RdfMappingContext context) {
    for (Dependency dependency : safe(bom.getDependencies())) {
      String parentRef = dependency.getRef();
      context.recordDependencyEntry(parentRef);
      Optional<Resource> parent = context.findOccurrenceByBomRef(parentRef);
      for (Dependency child : safe(dependency.getDependencies())) {
        String childRef = child.getRef();
        Optional<Resource> target = context.findOccurrenceByBomRef(childRef);
        if (parent.isPresent() && target.isPresent()) {
          context.model().add(parent.get(), RiskVocabulary.DEPENDS_ON, target.get());
        } else {
          context.recordUnresolvedReference(parentRef, childRef);
        }
      }
    }
  }

  private static <T> List<T> safe(List<T> values) {
    return values == null ? List.of() : values;
  }
}
