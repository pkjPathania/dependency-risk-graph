package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;
import java.util.Map;

public record SparqlSelectResponse(List<String> columns, List<Map<String, String>> rows) {}
