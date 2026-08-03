package io.github.pkjpathania.dependencyrisk.graph.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class SparqlServiceStatsTest {

  @Test
  void returnsOnlySerializableAlgebraRepresentations() {
    SparqlService service = new SparqlService(null, new ObjectMapper());

    var stats =
        service.stats(
            """
            SELECT ?osvId
            WHERE { ?subject ?predicate ?osvId }
            ORDER BY LCASE(STR(?osvId))
            """);
    String json = new ObjectMapper().writeValueAsString(stats);

    assertFalse(stats.raw().isBlank());
    assertFalse(stats.optimized().isBlank());
    assertFalse(stats.rawSse().isBlank());
    assertFalse(stats.optimizedSse().isBlank());
    assertTrue(json.contains("\"raw\""));
    assertTrue(json.contains("\"optimized\""));
    assertTrue(json.contains("\"rawSse\""));
    assertTrue(json.contains("\"optimizedSse\""));
    assertFalse(json.contains("\"query\""));
  }
}
