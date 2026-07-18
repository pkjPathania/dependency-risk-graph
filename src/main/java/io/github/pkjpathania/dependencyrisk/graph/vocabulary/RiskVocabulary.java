package io.github.pkjpathania.dependencyrisk.graph.vocabulary;

import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;

public final class RiskVocabulary {

  private static final String URI = "urn:io.github.pkjpathania.dependencyrisk:schema:";

  // Classes

  public static final Resource APPLICATION = resource("Application");

  public static final Resource PACKAGE_VERSION = resource("PackageVersion");

  public static final Resource VULNERABILITY = resource("Vulnerability");

  public static final Resource CVSS_ASSESSMENT = resource("CvssAssessment");

  // Existing application/package properties

  public static final Property NAME = property("name");

  public static final Property VERSION = property("version");

  public static final Property PURL = property("purl");

  public static final Property DEPENDS_ON = property("dependsOn");

  // Vulnerability relationships

  public static final Property AFFECTED_BY = property("affectedBy");

  public static final Property FIXED_IN = property("fixedIn");

  public static final Property HAS_SEVERITY = property("hasSeverity");

  // Vulnerability attributes

  public static final Property OSV_ID = property("osvId");

  public static final Property ALIAS = property("alias");

  public static final Property SUMMARY = property("summary");

  public static final Property DETAILS = property("details");

  public static final Property PUBLISHED_AT = property("publishedAt");

  public static final Property MODIFIED_AT = property("modifiedAt");

  public static final Property WITHDRAWN_AT = property("withdrawnAt");

  public static final Property REFERENCE_URL = property("referenceUrl");

  public static final Property SOURCE = property("source");

  // CVSS assessment attributes

  public static final Property CVSS_TYPE = property("cvssType");

  public static final Property CVSS_VERSION = property("cvssVersion");

  public static final Property VECTOR = property("vector");

  public static final Property BASE_SCORE = property("baseScore");

  public static final Property SEVERITY_LEVEL = property("severityLevel");


  private RiskVocabulary() {}

  public static String getUri() {
    return URI;
  }

  private static Resource resource(String localName) {
    return ResourceFactory.createResource(URI + localName);
  }

  private static Property property(String localName) {
    return ResourceFactory.createProperty(URI, localName);
  }
}
