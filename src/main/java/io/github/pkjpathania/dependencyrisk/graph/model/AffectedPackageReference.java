package io.github.pkjpathania.dependencyrisk.graph.model;

public record AffectedPackageReference(
    String packageIri, String packageName, String installedVersion) {}
