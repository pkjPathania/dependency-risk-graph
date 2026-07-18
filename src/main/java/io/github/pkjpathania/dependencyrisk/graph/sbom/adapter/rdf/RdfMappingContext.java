package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.IssueSeverity;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfImportContext;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ResourceIdentity;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportDiagnostics;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.UnresolvedReferenceIssue;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.cyclonedx.model.Component;
import org.cyclonedx.model.Service;

public final class RdfMappingContext {
  private final Model model;
  private final RdfImportContext importContext;
  private final Resource importResource;
  private final Map<String, Resource> occurrenceByBomRef = new LinkedHashMap<>();
  private final Map<String, Resource> canonicalPackageByNormalizedPurl = new HashMap<>();
  private final Map<String, Resource> packageByBomRef = new HashMap<>();
  private final Set<String> dependencyEntryRefs = new LinkedHashSet<>();
  private final SbomImportDiagnosticsCollector diagnostics;
  private final RdfResourceIdentityStrategy identityStrategy;
  private int anonymousOccurrenceSequence;
  private Resource application;

  public RdfMappingContext(
      Model model,
      RdfImportContext importContext,
      Resource importResource,
      SbomImportDiagnostics diagnostics,
      RdfResourceIdentityStrategy identityStrategy) {
    this.model = model;
    this.importContext = importContext;
    this.importResource = importResource;
    this.diagnostics = new SbomImportDiagnosticsCollector(diagnostics);
    this.identityStrategy = identityStrategy;
  }

  public Resource registerComponent(Component component) {
    Resource occurrence = registerOccurrence(component.getBomRef());
    identityStrategy
        .identifyPackageVersion(component)
        .ifPresent(
            identity -> {
              Resource canonical =
                  canonicalPackageByNormalizedPurl.computeIfAbsent(
                      identity.originalPurl(), ignored -> model.createResource(identity.iri()));
              canonical.addLiteral(RiskVocabulary.PURL, identity.originalPurl());
              packageByBomRef.putIfAbsent(component.getBomRef(), canonical);
              occurrence.addProperty(RiskVocabulary.INSTANCE_OF, canonical);
            });
    return occurrence;
  }

  public Resource registerMetadataComponent(Component component) {
    Resource occurrence = registerOccurrence(component.getBomRef());
    String fallbackIdentity =
        StringUtils.defaultIfBlank(
            component.getBomRef(), "content:" + importContext.contentSha256());
    ResourceIdentity identity = identityStrategy.identifyApplication(component, fallbackIdentity);
    application = model.createResource(identity.iri());
    occurrence.addProperty(RiskVocabulary.INSTANCE_OF, application);
    application.addProperty(RiskVocabulary.HAS_OCCURRENCE, occurrence);
    importResource.addProperty(RiskVocabulary.IMPORTS_APPLICATION, application);
    return occurrence;
  }

  public Optional<Resource> application() {
    return Optional.ofNullable(application);
  }

  public Resource registerService(Service service) {
    return registerOccurrence(service.getBomRef());
  }

  public Resource registerResource(String bomRef, Resource resource) {
    return resource;
  }

  public Optional<Resource> findOccurrenceByBomRef(String bomRef) {
    return Optional.ofNullable(occurrenceByBomRef.get(bomRef));
  }

  public Optional<Resource> findPackageByBomRef(String bomRef) {
    return Optional.ofNullable(packageByBomRef.get(bomRef));
  }

  public List<Resource> findPackagesByPurl(String normalizedPurl) {
    Resource resource = canonicalPackageByNormalizedPurl.get(normalizedPurl);
    return resource == null ? List.of() : List.of(resource);
  }

  public void recordDependencyEntry(String bomRef) {
    dependencyEntryRefs.add(bomRef);
  }

  public void recordUnresolvedReference(String parentRef, String childRef) {
    diagnostics.addIssue(
        new UnresolvedReferenceIssue(
            IssueSeverity.WARNING,
            parentRef,
            childRef,
            "Dependency references unknown bom-ref: " + childRef));
  }

  public Model model() {
    return model;
  }

  public RdfImportContext importContext() {
    return importContext;
  }

  public Resource importResource() {
    return importResource;
  }

  public SbomImportDiagnostics diagnostics() {
    return diagnostics.snapshot();
  }

  private Resource registerOccurrence(String bomRef) {
    String localIdentity =
        StringUtils.isBlank(bomRef)
            ? "anonymous:" + anonymousOccurrenceSequence++
            : bomRef;
    ResourceIdentity identity =
        identityStrategy.identifyOccurrence(importContext.importId(), localIdentity);
    Resource resource = model.createResource(identity.iri());
    if (StringUtils.isNotBlank(bomRef)) {
      Resource previous = occurrenceByBomRef.putIfAbsent(bomRef, resource);
      if (previous != null) {
        return previous;
      }
    }
    resource.addProperty(RDF.type, RiskVocabulary.COMPONENT_OCCURRENCE);
    resource.addProperty(RiskVocabulary.BELONGS_TO_IMPORT, importResource);
    return resource;
  }
}
