package io.github.pkjpathania.dependencyrisk.graph.sbom.application;

import io.github.pkjpathania.dependencyrisk.graph.parser.assembler.CycloneDxJsonAssembler;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.CycloneDxReadResult;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfImportContext;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.RdfMappingResult;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportCommand;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportDiagnostics;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportResult;
import io.github.pkjpathania.dependencyrisk.graph.sbom.port.CycloneDxBomReader;
import io.github.pkjpathania.dependencyrisk.graph.sbom.port.CycloneDxRdfMapper;
import io.github.pkjpathania.dependencyrisk.graph.sbom.port.RdfGraphStore;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.util.GenUtil;
import java.time.Duration;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.apache.jena.rdf.model.Resource;
import org.cyclonedx.model.Component;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public final class SbomImportService implements ImportSbomUseCase {
  private final CycloneDxBomReader bomReader;
  private final CycloneDxRdfMapper rdfMapper;
  private final RdfGraphStore graphStore;
  private final ImportIdGenerator importIdGenerator;
  private final CycloneDxJsonAssembler assembler;

  public SbomImportService(
      CycloneDxBomReader bomReader,
      CycloneDxRdfMapper rdfMapper,
      RdfGraphStore graphStore,
      ImportIdGenerator importIdGenerator,
      CycloneDxJsonAssembler assembler) {
    this.bomReader = bomReader;
    this.rdfMapper = rdfMapper;
    this.graphStore = graphStore;
    this.importIdGenerator = importIdGenerator;
    this.assembler = assembler;
  }

  @Override
  public SbomImportResult importSbom(SbomImportCommand command) {
    Instant startedAt = Instant.now();
    String importId = importIdGenerator.generate();
    CycloneDxReadResult readResult = bomReader.read(command.content());
    RdfImportContext context =
        new RdfImportContext(
            importId,
            readResult.declaredSpecVersion(),
            command.originalFilename(),
            command.source(),
            GenUtil.sha256Bytes(command.content()),
            command.receivedAt(),
            readResult.serialNumber());
    RdfMappingResult mapping = rdfMapper.map(readResult.bom(), context);
    graphStore.save(mapping.identity(), mapping.model());

    Component root =
        readResult.bom().getMetadata() == null
            ? null
            : readResult.bom().getMetadata().getComponent();
    SbomImportDiagnostics diagnostics = mapping.diagnostics();
    log.info(
        "Imported SBOM importId={} filename={} components={} dependencyEdges={} quality={} durationMs={}",
        importId,
        command.originalFilename(),
        diagnostics.componentCount(),
        diagnostics.dependencyEdgeCount(),
        diagnostics.graphQuality(),
        Duration.between(startedAt, Instant.now()).toMillis());
    return new SbomImportResult(
        importId,
        importId,
        importRun(mapping, importId).getURI(),
        importRun(mapping, importId)
            .getPropertyResourceValue(RiskVocabulary.ROOT_OCCURRENCE)
            .getURI(),
        root == null ? null : root.getName(),
        root == null ? null : root.getVersion(),
        readResult.declaredSpecVersion(),
        diagnostics.componentCount(),
        diagnostics.dependencyEdgeCount(),
        diagnostics.graphQuality(),
        diagnostics.issues());
  }

  private Resource importRun(RdfMappingResult mapping, String importId) {
    return mapping
        .model()
        .listResourcesWithProperty(RiskVocabulary.IMPORT_ID, importId)
        .nextOptional()
        .orElseThrow(
            () -> new IllegalStateException("Mapped RDF has no ImportRun for " + importId));
  }
}
