package io.github.pkjpathania.dependencyrisk.graph.model;

public record PathNodeView(
    String iri, String label, String version, String purl, String nodeType) {}
