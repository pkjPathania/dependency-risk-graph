package io.github.pkjpathania.dependencyrisk.graph.model;

public record DependencySummary(
    String iri, String name, String version, String purl, boolean direct) {}
