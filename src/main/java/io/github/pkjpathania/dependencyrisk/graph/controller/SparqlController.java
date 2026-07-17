package io.github.pkjpathania.dependencyrisk.graph.controller;

import io.github.pkjpathania.dependencyrisk.graph.service.SparqlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sparql")
@RequiredArgsConstructor
public class SparqlController {

  private final SparqlService sparqlService;

  @PostMapping(
      path = "/format",
      consumes = {
        MediaType.TEXT_PLAIN_VALUE,
      })
  public ResponseEntity<String> format(@RequestBody String rawSparql) {
    String formattedQuery = sparqlService.format(rawSparql);

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("application/sparql-query"))
        .body(formattedQuery);
  }

  @PostMapping("/exec")
  public ResponseEntity<?> exec(@RequestBody String rawSparql) {
    return ResponseEntity.ok(sparqlService.execute(rawSparql));
  }

  @GetMapping("/summaries")
  public ResponseEntity<?> getSummaries() {
    return ResponseEntity.ok(sparqlService.getSummaries());
  }
}
