package io.github.pkjpathania.dependencyrisk.graph.controller;

import io.github.pkjpathania.dependencyrisk.graph.model.GraphMetadata;
import io.github.pkjpathania.dependencyrisk.graph.parser.assembler.CycloneDxJsonAssembler;
import io.github.pkjpathania.dependencyrisk.graph.service.RdfExportService;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/rdf")
@RequiredArgsConstructor
public class IngestionController {

  private final CycloneDxJsonAssembler assembler;
  private final RdfExportService rdfExportService;

  @PostMapping(
      path = "/new",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public GraphMetadata newGraph(@RequestPart("file") MultipartFile file) {
    if (file.isEmpty()) {
      throw new IllegalArgumentException("SBOM file is required");
    }

    try {
      assembler.save(file.getBytes());
      return rdfExportService.getSummary();
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to read uploaded SBOM", exception);
    }
  }
}
