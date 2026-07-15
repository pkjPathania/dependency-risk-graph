package io.github.pkjpathania.dependencyrisk.ingestion.model;

import java.util.List;

public record NormalizedSbom(
    String applicationName,
    String applicationVersion,
    List<PackageComponent> components,
    List<DependencyEdge> dependencies) {}
