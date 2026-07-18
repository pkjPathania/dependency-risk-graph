package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

public record ResourceIdentity(String iri, String originalBomRef, String originalPurl) {}
