package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.util.List;
import java.util.Optional;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.cyclonedx.model.Component;
import org.cyclonedx.model.ExternalReference;
import org.cyclonedx.model.Hash;
import org.cyclonedx.model.Property;

@org.springframework.stereotype.Component
public final class ComponentMapper {
  public void map(
      Component component, Resource occurrence, Optional<Resource> canonicalPackage, boolean root) {
    occurrence.addProperty(RDF.type, RiskVocabulary.COMPONENT_OCCURRENCE);
    if (root) {
      occurrence.addProperty(RDF.type, RiskVocabulary.APPLICATION_OCCURRENCE);
      canonicalPackage.ifPresent(
          application -> {
            application.addProperty(RDF.type, RiskVocabulary.APPLICATION);
            application.addProperty(RDF.type, RiskVocabulary.SOFTWARE_PRODUCT);
            add(application, RDFS.label, component.getName());
            add(application, RiskVocabulary.NAME, component.getName());
            add(application, RiskVocabulary.VERSION, component.getVersion());
            add(application, RiskVocabulary.PURL, component.getPurl());
          });
    } else {
      occurrence.addProperty(RDF.type, RiskVocabulary.PACKAGE_OCCURRENCE);
      if (component.getPurl() == null) {
        occurrence.addProperty(RDF.type, RiskVocabulary.SOFTWARE_MODULE);
      }
    }
    add(occurrence, RDFS.label, component.getName());
    add(occurrence, RiskVocabulary.BOM_REF, component.getBomRef());
    add(occurrence, RiskVocabulary.NAME, component.getName());
    add(occurrence, RiskVocabulary.VERSION, component.getVersion());
    add(occurrence, RiskVocabulary.DESCRIPTION, component.getDescription());
    add(occurrence, RiskVocabulary.AUTHOR, component.getAuthor());
    Resource packageResource = root ? null : canonicalPackage.orElse(null);
    if (packageResource != null) {
      packageResource.addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION);
      add(packageResource, RDFS.label, component.getName());
      add(packageResource, RiskVocabulary.PURL, packagePurl(canonicalPackage.get(), component));
      add(packageResource, RiskVocabulary.GROUP, component.getGroup());
      add(packageResource, RiskVocabulary.NAME, component.getName());
      add(packageResource, RiskVocabulary.VERSION, component.getVersion());
      add(packageResource, RiskVocabulary.DESCRIPTION, component.getDescription());
    }
    if (component.getType() != null) {
      add(occurrence, RiskVocabulary.COMPONENT_TYPE, component.getType().name());
    }
    if (component.getScope() != null) {
      add(occurrence, RiskVocabulary.SCOPE, component.getScope().name());
    }
    for (Hash hash : safe(component.getHashes())) {
      add(occurrence, RiskVocabulary.HASH, hash.getAlgorithm() + ":" + hash.getValue());
    }
    for (Property property : safe(component.getProperties())) {
      add(occurrence, RiskVocabulary.COMPONENT_PROPERTY, property.getName() + "=" + property.getValue());
    }
    for (ExternalReference reference : safe(component.getExternalReferences())) {
      add(occurrence, RiskVocabulary.EXTERNAL_REFERENCE, reference.getUrl());
    }
  }

  private String packagePurl(Resource canonicalPackage, Component component) {
    return canonicalPackage.hasProperty(RiskVocabulary.PURL)
        ? canonicalPackage.getProperty(RiskVocabulary.PURL).getString()
        : component.getPurl();
  }

  private void add(Resource resource, org.apache.jena.rdf.model.Property property, String value) {
    if (StringUtils.isNotBlank(value)) {
      resource.addProperty(property, value);
    }
  }

  private static <T> List<T> safe(List<T> values) {
    return values == null ? List.of() : values;
  }
}
