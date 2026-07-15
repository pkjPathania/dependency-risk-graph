package io.github.pkjpathania.dependencyrisk.ingestion.model;

import java.util.List;

public record DependencyEdge(String sourceRef, List<String> targetRefs) {}
