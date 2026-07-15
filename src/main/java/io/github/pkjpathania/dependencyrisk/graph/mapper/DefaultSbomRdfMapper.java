package io.github.pkjpathania.dependencyrisk.graph.mapper;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.ingestion.model.DependencyEdge;
import io.github.pkjpathania.dependencyrisk.ingestion.model.NormalizedSbom;
import io.github.pkjpathania.dependencyrisk.ingestion.model.PackageComponent;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.springframework.stereotype.Component;

@Component
public class DefaultSbomRdfMapper implements SbomRdfMapper {
  private static final String RESOURCE_NS = "urn:io.github.pkjpathania.dependencyrisk:resource:";

  @Override
  public Model map(NormalizedSbom sbom) {
    Model model = ModelFactory.createDefaultModel();
    model.setNsPrefix("drg", RiskVocabulary.getUri());
    model.setNsPrefix("res", RESOURCE_NS);
    model.setNsPrefix("rdf", RDF.getURI());
    model.setNsPrefix("rdfs", RDFS.getURI());

    Map<String, Resource> resourcesByReferences = new HashMap<>();
    String applicationRef = findApplicationRef(sbom);
    Resource application = createResource(model, applicationRef);

    application
        .addProperty(RDF.type, RiskVocabulary.APPLICATION)
        .addProperty(RDFS.label, sbom.applicationName());

    if (StringUtils.isNotBlank(sbom.applicationName())) {
      application.addProperty(RiskVocabulary.VERSION, sbom.applicationVersion());
    }
    resourcesByReferences.put(applicationRef, application);

    for (PackageComponent component : sbom.components()) {
      Resource packageVersion = createResource(model, component.bomRef());

      packageVersion
          .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
          .addProperty(RDFS.label, component.name());
      if (StringUtils.isNotBlank(component.version())) {
        packageVersion.addProperty(RiskVocabulary.VERSION, component.version());
      }
      if (StringUtils.isNotBlank(component.purl())) {
        packageVersion.addProperty(RiskVocabulary.PURL, component.purl());
      }

      resourcesByReferences.put(component.bomRef(), packageVersion);
    }

    for (DependencyEdge edge : sbom.dependencies()) {
      Resource source =
          resourcesByReferences.computeIfAbsent(
              edge.sourceRef(), ref -> createResource(model, ref));

      for (String targetRef : edge.targetRefs()) {
        Resource target =
            resourcesByReferences.computeIfAbsent(targetRef, ref -> createResource(model, ref));
        source.addProperty(RiskVocabulary.DEPENDS_ON, target);
      }
    }

    return model;
  }

  private String findApplicationRef(NormalizedSbom sbom) {
    Set<String> componentRefs =
        sbom.components().stream().map(PackageComponent::bomRef).collect(Collectors.toSet());

    return sbom.dependencies().stream()
        .map(DependencyEdge::sourceRef)
        .filter(componentRef -> !componentRefs.contains(componentRef))
        .findFirst()
        .orElse("application:" + sbom.applicationName());
  }

  private Resource createResource(Model model, String identifier) {
    String encoderIdentifier = URLEncoder.encode(identifier, StandardCharsets.UTF_8);
    return model.createResource(RESOURCE_NS + encoderIdentifier);
  }
}
