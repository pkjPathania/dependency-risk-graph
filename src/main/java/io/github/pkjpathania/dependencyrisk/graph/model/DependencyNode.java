package io.github.pkjpathania.dependencyrisk.graph.model;

import io.github.pkjpathania.dependencyrisk.graph.enums.NodeType;

public record DependencyNode(
    String iri, String label, String version, String purl, NodeType type) {}
