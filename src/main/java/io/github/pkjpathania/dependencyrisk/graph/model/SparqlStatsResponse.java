package io.github.pkjpathania.dependencyrisk.graph.model;

public record SparqlStatsResponse(
    String raw, String optimized, String rawSse, String optimizedSse) {}
