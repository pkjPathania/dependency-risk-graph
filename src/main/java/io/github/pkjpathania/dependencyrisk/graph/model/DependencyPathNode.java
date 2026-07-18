package io.github.pkjpathania.dependencyrisk.graph.model;

public record DependencyPathNode(
    String occurrenceIri, String label, String version, String purl, String type) {}
