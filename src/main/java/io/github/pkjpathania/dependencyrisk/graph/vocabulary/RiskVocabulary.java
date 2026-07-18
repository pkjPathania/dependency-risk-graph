package io.github.pkjpathania.dependencyrisk.graph.vocabulary;

import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;

public final class RiskVocabulary {

  private static final String URI = "urn:io.github.pkjpathania.dependencyrisk:schema:";
  public static final Resource APPLICATION = resource("Application");
  public static final Resource PACKAGE_VERSION = resource("PackageVersion");
  public static final Property NAME = property("name");
  public static final Property VERSION = property("version");
  public static final Property PURL = property("purl");
  public static final Property DEPENDS_ON = property("dependsOn");
  public static final Resource VULNERABILITY = resource("Vulnerability");
  public static final Property AFFECTED_BY = property("affectedBy");
  public static final Property OSV_ID = property("osvId");
  public static final Property ALIAS = property("alias");
  public static final Property SUMMARY = property("summary");
  public static final Property DETAILS = property("details");
  public static final Property PUBLISHED_AT = property("publishedAt");
  public static final Property MODIFIED_AT = property("modifiedAt");
  public static final Property WITHDRAWN_AT = property("withdrawnAt");
  public static final Property FIXED_VERSION = property("fixedVersion");
  public static final Property FIXED_IN = property("fixedIn");
  public static final Property SOURCE = property("source");
  public static final Resource REFERENCE = property("Reference");
  public static final Property HAS_REFERENCE = property("hasReference");
  public static final Property REFERENCE_TYPE = property("referenceType");
  public static final Property REFERENCE_URL = property("referenceUrl");

  private RiskVocabulary() {}

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
