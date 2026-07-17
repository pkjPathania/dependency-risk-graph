package io.github.pkjpathania.dependencyrisk.graph.mapper;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.ingestion.model.DependencyEdge;
import io.github.pkjpathania.dependencyrisk.ingestion.model.NormalizedSbom;
import io.github.pkjpathania.dependencyrisk.ingestion.model.PackageComponent;
import java.util.HashMap;
import java.util.Locale;
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

    /*
     * CycloneDX dependency edges use bom-ref values.
     * We keep that reference only as the lookup key.
     */
    String applicationRef = findApplicationRef(sbom);

    Resource application = createApplicationResource(model, sbom);

    application
        .addProperty(RDF.type, RiskVocabulary.APPLICATION)
        .addProperty(RDFS.label, defaultIfBlank(sbom.applicationName(), "unknown-application"));

    if (StringUtils.isNotBlank(sbom.applicationVersion())) {
      application.addProperty(RiskVocabulary.VERSION, sbom.applicationVersion());
    }

    resourcesByReferences.put(applicationRef, application);

    for (PackageComponent component : sbom.components()) {
      Resource packageVersion = createPackageResource(model, component);

      packageVersion
          .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
          .addProperty(RDFS.label, defaultIfBlank(component.name(), "unknown-package"));

      if (StringUtils.isNotBlank(component.version())) {
        packageVersion.addProperty(RiskVocabulary.VERSION, component.version());
      }

      if (StringUtils.isNotBlank(component.purl())) {
        /*
         * Keep the original PURL unchanged as data.
         * It is no longer used as the RDF IRI.
         */
        packageVersion.addProperty(RiskVocabulary.PURL, component.purl());
      }

      if (StringUtils.isNotBlank(component.bomRef())) {
        resourcesByReferences.put(component.bomRef(), packageVersion);
      }
    }

    for (DependencyEdge edge : sbom.dependencies()) {
      Resource source =
          resourcesByReferences.computeIfAbsent(
              edge.sourceRef(), reference -> createFallbackResource(model, reference));

      for (String targetRef : edge.targetRefs()) {
        Resource target =
            resourcesByReferences.computeIfAbsent(
                targetRef, reference -> createFallbackResource(model, reference));

        source.addProperty(RiskVocabulary.DEPENDS_ON, target);
      }
    }

    return model;
  }

  private Resource createApplicationResource(Model model, NormalizedSbom sbom) {
    String iri =
        RESOURCE_NS
            + "application:"
            + segment(sbom.applicationName())
            + ":"
            + segment(sbom.applicationVersion());

    return model.createResource(iri);
  }

  private Resource createPackageResource(Model model, PackageComponent component) {
    String iri =
        RESOURCE_NS
            + "package:"
            + segment(component.group())
            + ":"
            + segment(component.name())
            + ":"
            + segment(component.version())
            + ":"
            + segment(component.type());

    return model.createResource(iri);
  }

  /**
   * Used only when a dependency refers to a bom-ref for which the SBOM did not provide a
   * corresponding component.
   */
  private Resource createFallbackResource(Model model, String reference) {
    return model.createResource(RESOURCE_NS + "unresolved:" + segment(reference));
  }

  private String findApplicationRef(NormalizedSbom sbom) {
    Set<String> componentRefs =
        sbom.components().stream()
            .map(PackageComponent::bomRef)
            .filter(StringUtils::isNotBlank)
            .collect(Collectors.toSet());

    return sbom.dependencies().stream()
        .map(DependencyEdge::sourceRef)
        .filter(StringUtils::isNotBlank)
        .filter(ref -> !componentRefs.contains(ref))
        .findFirst()
        .orElseGet(() -> "application:" + defaultIfBlank(sbom.applicationName(), "unknown"));
  }

  private String segment(String value) {
    if (StringUtils.isBlank(value)) {
      return "unknown";
    }

    return value
        .trim()
        .toLowerCase(Locale.ROOT)
        /*
         * These characters are safe and readable in a URN segment.
         * Everything else becomes a hyphen.
         */
        .replaceAll("[^a-z0-9._~-]", "-")
        .replaceAll("-+", "-")
        .replaceAll("(^-|-$)", "");
  }

  private String defaultIfBlank(String value, String fallback) {
    return StringUtils.isNotBlank(value) ? value : fallback;
  }
}
