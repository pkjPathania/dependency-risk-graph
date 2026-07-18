package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.cyclonedx.CycloneDxGraphAnalyzer;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ImportedBomIdentity;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfImportContext;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfMappingResult;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportDiagnostics;
import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.CycloneDxMappingException;
import io.github.pkjpathania.dependencyrisk.graph.sbom.port.CycloneDxRdfMapper;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.cyclonedx.model.Bom;
import org.cyclonedx.model.Component;
import org.cyclonedx.model.Composition;
import org.cyclonedx.model.Service;
import org.cyclonedx.model.vulnerability.Vulnerability;

@org.springframework.stereotype.Component
public final class DefaultCycloneDxRdfMapper implements CycloneDxRdfMapper {
  private static final String RESOURCE_NS =
      "urn:io.github.pkjpathania.dependencyrisk:resource:";

  private final CycloneDxGraphAnalyzer analyzer;
  private final RdfResourceIdentityStrategy identityStrategy;
  private final MetadataComponentMapper metadataComponentMapper;
  private final ComponentMapper componentMapper;
  private final ServiceMapper serviceMapper;
  private final DependencyMapper dependencyMapper;
  private final VulnerabilityMapper vulnerabilityMapper;
  private final CompositionMapper compositionMapper;

  public DefaultCycloneDxRdfMapper(
      CycloneDxGraphAnalyzer analyzer,
      RdfResourceIdentityStrategy identityStrategy,
      MetadataComponentMapper metadataComponentMapper,
      ComponentMapper componentMapper,
      ServiceMapper serviceMapper,
      DependencyMapper dependencyMapper,
      VulnerabilityMapper vulnerabilityMapper,
      CompositionMapper compositionMapper) {
    this.analyzer = analyzer;
    this.identityStrategy = identityStrategy;
    this.metadataComponentMapper = metadataComponentMapper;
    this.componentMapper = componentMapper;
    this.serviceMapper = serviceMapper;
    this.dependencyMapper = dependencyMapper;
    this.vulnerabilityMapper = vulnerabilityMapper;
    this.compositionMapper = compositionMapper;
  }

  @Override
  public RdfMappingResult map(Bom bom, RdfImportContext importContext) {
    try {
      Model model = ModelFactory.createDefaultModel();
      model.setNsPrefix("risk", RiskVocabulary.getUri());
      SbomImportDiagnostics analyzed =
          analyzer.analyze(bom, importContext.declaredSpecVersion());
      ImportedBomIdentity identity =
          new ImportedBomIdentity(
              importContext.importId(),
              importContext.serialNumber(),
              importContext.sourceFilename(),
              importContext.contentSha256(),
              importContext.importedAt());
      Resource importResource =
          model.createResource(identityStrategy.identifyImport(identity).iri());
      RdfMappingContext context =
          new RdfMappingContext(model, importContext, importResource, analyzed, identityStrategy);

      Resource document = createDocument(context);
      initializeImport(context, document);

      // Phase 1: register every referencable object before creating relationships.
      Component root =
          bom.getMetadata() == null ? null : bom.getMetadata().getComponent();
      if (root != null) {
        Resource rootResource = context.registerMetadataComponent(root);
        metadataComponentMapper.map(root, rootResource, context.application());
        Resource application = context.application().orElseThrow();
        model.add(document, RiskVocabulary.DESCRIBES, application);
        model.add(importResource, RiskVocabulary.ROOT_OCCURRENCE, rootResource);
        model.add(importResource, RiskVocabulary.IMPORTS_APPLICATION, application);
        String applicationIdentity =
            context
                .findPackageByBomRef(root.getBomRef())
                .filter(packageResource -> packageResource.hasProperty(RiskVocabulary.PURL))
                .map(packageResource -> packageResource.getProperty(RiskVocabulary.PURL).getString())
                .orElseGet(
                    () ->
                        StringUtils.defaultIfBlank(
                            root.getBomRef(), "content:" + importContext.contentSha256()));
        add(importResource, RiskVocabulary.APPLICATION_IDENTITY, applicationIdentity);
      }
      for (Component component : flattenedTopLevelComponents(bom)) {
        Resource resource = context.registerComponent(component);
        componentMapper.map(
            component, resource, context.findPackageByBomRef(component.getBomRef()), false);
      }
      for (Service service : analyzer.allServices(bom)) {
        Resource resource = context.registerService(service);
        serviceMapper.map(service, resource);
      }
      Map<Vulnerability, Resource> vulnerabilities = vulnerabilityMapper.register(bom, context);
      Map<Composition, Resource> compositions = compositionMapper.register(bom, context);

      // Phase 2: create only relationships explicitly supplied by CycloneDX.
      dependencyMapper.map(bom, context);
      vulnerabilityMapper.mapRelationships(bom, context, vulnerabilities);
      compositionMapper.mapRelationships(bom, context, document, compositions);
      model.add(importResource, RiskVocabulary.IMPORTED_DOCUMENT, document);

      SbomImportDiagnostics diagnostics = context.diagnostics();
      diagnostics
          .dependencyInformationByBomRef()
          .forEach(
              (bomRef, status) ->
                  context
                      .findOccurrenceByBomRef(bomRef)
                      .ifPresent(
                          resource ->
                              resource.addLiteral(
                                  RiskVocabulary.DEPENDENCY_INFORMATION_STATUS,
                                  status.name())));
      addImportMetrics(importResource, diagnostics);
      return new RdfMappingResult(model, diagnostics, identity);
    } catch (RuntimeException exception) {
      if (exception instanceof CycloneDxMappingException mappingException) {
        throw mappingException;
      }
      throw new CycloneDxMappingException("Failed to map CycloneDX BOM to RDF", exception);
    }
  }

  private Resource createDocument(RdfMappingContext context) {
    RdfImportContext value = context.importContext();
    Resource document =
        context
            .model()
            .createResource(RESOURCE_NS + "sbom:" + value.importId())
            .addProperty(RDF.type, RiskVocabulary.SBOM_DOCUMENT);
    add(document, RiskVocabulary.SERIAL_NUMBER, value.serialNumber());
    add(document, RiskVocabulary.SPEC_VERSION, value.declaredSpecVersion());
    add(document, RiskVocabulary.SOURCE_FILENAME, value.sourceFilename());
    add(document, RiskVocabulary.SOURCE, value.source());
    add(document, RiskVocabulary.CONTENT_SHA256, value.contentSha256());
    add(document, RiskVocabulary.IMPORTED_AT, value.importedAt().toString());
    document.addProperty(RiskVocabulary.BELONGS_TO_IMPORT, context.importResource());
    return document;
  }

  private void initializeImport(RdfMappingContext context, Resource document) {
    Resource importResource = context.importResource();
    importResource.addProperty(RDF.type, RiskVocabulary.SBOM_IMPORT);
    importResource.addProperty(RDF.type, RiskVocabulary.IMPORT_RUN);
    importResource.addLiteral(RiskVocabulary.IMPORT_ID, context.importContext().importId());
    importResource.addLiteral(RiskVocabulary.ACTIVE, true);
    importResource.addProperty(RiskVocabulary.IMPORTED_DOCUMENT, document);
    importResource.addProperty(RiskVocabulary.SOURCE_DOCUMENT, document);
  }

  private void addImportMetrics(Resource importRun, SbomImportDiagnostics diagnostics) {
    importRun.addLiteral(RiskVocabulary.GRAPH_QUALITY, diagnostics.graphQuality().name());
    importRun.addLiteral(RiskVocabulary.ISSUE_COUNT, diagnostics.issues().size());
    importRun.addLiteral(RiskVocabulary.COMPONENT_COUNT, diagnostics.componentCount());
    importRun.addLiteral(
        RiskVocabulary.DEPENDENCY_EDGE_COUNT, diagnostics.dependencyEdgeCount());
  }

  private List<Component> flattenedTopLevelComponents(Bom bom) {
    List<Component> all = analyzer.allComponents(bom);
    Component root =
        bom.getMetadata() == null ? null : bom.getMetadata().getComponent();
    return root == null ? all : all.subList(1, all.size());
  }

  private void add(Resource resource, org.apache.jena.rdf.model.Property property, String value) {
    if (StringUtils.isNotBlank(value)) {
      resource.addProperty(property, value);
    }
  }
}
