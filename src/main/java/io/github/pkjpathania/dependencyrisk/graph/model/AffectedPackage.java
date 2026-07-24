package io.github.pkjpathania.dependencyrisk.graph.model;

public record AffectedPackage(
    String packageIri,
    String packageName,
    String version,
    String purl,
    String vulnerability,
    String osvId) {}
