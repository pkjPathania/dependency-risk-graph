package io.github.pkjpathania.dependencyrisk.ingestion.model;

public record PackageComponent(
    String bomRef, String group, String name, String version, String purl, String type) {}
