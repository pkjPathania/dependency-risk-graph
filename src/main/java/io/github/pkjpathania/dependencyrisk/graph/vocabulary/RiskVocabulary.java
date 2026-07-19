package io.github.pkjpathania.dependencyrisk.graph.vocabulary;

import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;

public final class RiskVocabulary {

  private static final String URI = "urn:io-github-pkjpathania:dependency-risk-graph:schema:";

  // Classes

  public static final Resource APPLICATION = resource("Application");

  public static final Resource SOFTWARE_PRODUCT = resource("SoftwareProduct");

  public static final Resource SOFTWARE_MODULE = resource("SoftwareModule");

  public static final Resource PACKAGE_VERSION = resource("PackageVersion");

  public static final Resource COMPONENT_OCCURRENCE = resource("ComponentOccurrence");

  public static final Resource APPLICATION_OCCURRENCE = resource("ApplicationOccurrence");

  public static final Resource PACKAGE_OCCURRENCE = resource("PackageOccurrence");

  public static final Resource SBOM_IMPORT = resource("SbomImport");

  public static final Resource SERVICE = resource("Service");

  public static final Resource VULNERABILITY = resource("Vulnerability");

  public static final Resource CVSS_ASSESSMENT = resource("CvssAssessment");

  public static final Resource SBOM_DOCUMENT = resource("SbomDocument");

  public static final Resource IMPORT_RUN = resource("ImportRun");

  public static final Resource COMPOSITION = resource("Composition");

  // Existing application/package properties

  public static final Property NAME = property("name");

  public static final Property BOM_REF = property("bomRef");

  public static final Property VERSION = property("version");

  public static final Property PURL = property("purl");

  public static final Property COMPONENT_TYPE = property("componentType");

  public static final Property GROUP = property("group");

  public static final Property DESCRIPTION = property("description");

  public static final Property SCOPE = property("scope");

  public static final Property AUTHOR = property("author");

  public static final Property HASH = property("hash");

  public static final Property COMPONENT_PROPERTY = property("componentProperty");

  public static final Property EXTERNAL_REFERENCE = property("externalReference");

  public static final Property DEPENDS_ON = property("dependsOn");

  public static final Property IMPORT_ID = property("importId");

  public static final Property ROOT_OCCURRENCE = property("rootOccurrence");

  public static final Property TOP_LEVEL_OCCURRENCE = property("topLevelOccurrence");

  public static final Property BELONGS_TO_IMPORT = property("belongsToImport");

  public static final Property INSTANCE_OF = property("instanceOf");

  public static final Property HAS_OCCURRENCE = property("hasOccurrence");

  public static final Property IMPORTS_APPLICATION = property("importsApplication");

  public static final Property SOURCE_DOCUMENT = property("sourceDocument");

  public static final Property ACTIVE_IMPORT = property("activeImport");

  public static final Property APPLICATION_IDENTITY = property("applicationIdentity");

  public static final Property ACTIVE = property("active");

  public static final Property HAS_ASSEMBLY = property("hasAssembly");

  public static final Property HAS_COMPOSITION = property("hasComposition");

  public static final Property COMPOSITION_AGGREGATE = property("compositionAggregate");

  public static final Property DESCRIBES = property("describes");

  public static final Property IMPORTED_DOCUMENT = property("importedDocument");

  public static final Property SPEC_VERSION = property("specVersion");

  public static final Property SERIAL_NUMBER = property("serialNumber");

  public static final Property SOURCE_FILENAME = property("sourceFilename");

  public static final Property CONTENT_SHA256 = property("contentSha256");

  public static final Property IMPORTED_AT = property("importedAt");

  public static final Property GRAPH_QUALITY = property("graphQuality");

  public static final Property ISSUE_COUNT = property("issueCount");

  public static final Property COMPONENT_COUNT = property("componentCount");

  public static final Property DEPENDENCY_EDGE_COUNT = property("dependencyEdgeCount");

  public static final Property DEPENDENCY_INFORMATION_STATUS =
      property("dependencyInformationStatus");

  public static final Property RECOMMENDATION = property("recommendation");

  public static final Property ANALYSIS_STATE = property("analysisState");

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
