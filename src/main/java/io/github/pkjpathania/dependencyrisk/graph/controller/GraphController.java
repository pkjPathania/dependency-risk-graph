package io.github.pkjpathania.dependencyrisk.graph.controller;

import io.github.pkjpathania.dependencyrisk.graph.service.RdfExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/")
@RequiredArgsConstructor
public class GraphController {

  private final RdfExportService exportService;

  @GetMapping("metadata")
  public ResponseEntity<?> getGraph() {
    return ResponseEntity.ok(exportService.getSummary());
  }
}
