package io.github.pkjpathania.dependencyrisk.graph.vocabulary;

import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;

public final class RiskVocabulary {

  private static final String URI = "urn:io.github.pkjpathania.dependencyrisk:schema:";
  public static final Resource APPLICATION =
      resource("Application");
  public static final Resource PACKAGE_VERSION =
      resource("PackageVersion");
  public static final Property NAME =
      property("name");
  public static final Property VERSION =
      property("version");
  public static final Property PURL =
      property("purl");
  public static final Property DEPENDS_ON =
      property("dependsOn");

  private RiskVocabulary(){

  }

  public static String getUri() {
    return URI;
  }

  private static Resource resource(String uriRef) {
    return ResourceFactory.createResource(URI + uriRef);
  }

  public static Property property(String localName) {
    return ResourceFactory.createProperty(URI, localName);
  }
}
