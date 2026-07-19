package io.github.pkjpathania.dependencyrisk.ingestion.controller;

import io.github.pkjpathania.dependencyrisk.graph.parser.assembler.CycloneDxJsonAssembler;
import io.github.pkjpathania.dependencyrisk.graph.model.GraphMetadata;
import io.github.pkjpathania.dependencyrisk.graph.sbom.application.ImportSbomUseCase;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportCommand;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportResult;
import io.github.pkjpathania.dependencyrisk.graph.service.RdfExportService;
import java.io.IOException;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/sboms")
public class SbomController {
  private final ImportSbomUseCase importSbomUseCase;
  private final CycloneDxJsonAssembler assembler;
  private final RdfExportService rdfExportService;

  @PostMapping(
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public SbomImportResult upload(@RequestPart("file") MultipartFile file) {
    return importFile(file);
  }

  @PostMapping(
      path = "/rdf",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public GraphMetadata newGraph(@RequestPart("file") MultipartFile file) {
    validateFile(file);
    try {
      assembler.save(file.getBytes());
      return rdfExportService.getSummary();
    } catch (IOException e) {
      throw new IllegalStateException("Unable to read uploaded SBOM", e);
    }
  }

  private SbomImportResult importFile(MultipartFile file) {
    validateFile(file);
    try {
      String filename =
          file.getOriginalFilename() == null ? "uploaded-sbom.json" : file.getOriginalFilename();
      return importSbomUseCase.importSbom(
          new SbomImportCommand(file.getBytes(), filename, "HTTP_UPLOAD", Instant.now()));
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to read uploaded SBOM", exception);
    }
  }

  private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("SBOM file is required");
    }
  }
}
