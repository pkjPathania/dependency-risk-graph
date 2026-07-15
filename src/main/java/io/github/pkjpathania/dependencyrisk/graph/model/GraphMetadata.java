package io.github.pkjpathania.dependencyrisk.graph.model;

import tools.jackson.databind.JsonNode;

public record GraphMetadata(GraphSummary summary, JsonNode graph) {}
