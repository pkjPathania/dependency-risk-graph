package io.github.pkjpathania.dependencyrisk.ingestion.controller;

import io.github.pkjpathania.dependencyrisk.graph.service.RdfExportService;
import io.github.pkjpathania.dependencyrisk.ingestion.model.NormalizedSbom;
import io.github.pkjpathania.dependencyrisk.ingestion.service.SbomIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/sboms")
public class SbomController {
  private final SbomIngestionService sbomIngestionService;
  private final RdfExportService rdfExportService;

  @PostMapping(
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public NormalizedSbom upload(@RequestPart("file") MultipartFile file) {
    return sbomIngestionService.ingest(file);
  }

  @PostMapping(
      path = "/rdf",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<?> newGraph(@RequestPart("file") MultipartFile file) {
    return ResponseEntity.ok(rdfExportService.newGraph(file));
  }
}
