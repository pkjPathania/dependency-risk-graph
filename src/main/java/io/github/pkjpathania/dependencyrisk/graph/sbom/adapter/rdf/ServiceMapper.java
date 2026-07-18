package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.cyclonedx.model.Service;
import org.springframework.stereotype.Component;

@Component
public final class ServiceMapper {
  public void map(Service service, Resource resource) {
    resource.addProperty(RDF.type, RiskVocabulary.SERVICE);
    add(resource, RDFS.label, service.getName());
    add(resource, RiskVocabulary.BOM_REF, service.getBomRef());
    add(resource, RiskVocabulary.GROUP, service.getGroup());
    add(resource, RiskVocabulary.NAME, service.getName());
    add(resource, RiskVocabulary.VERSION, service.getVersion());
    add(resource, RiskVocabulary.DESCRIPTION, service.getDescription());
  }

  private void add(Resource resource, org.apache.jena.rdf.model.Property property, String value) {
    if (StringUtils.isNotBlank(value)) {
      resource.addProperty(property, value);
    }
  }
}
