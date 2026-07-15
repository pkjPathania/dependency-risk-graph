package io.github.pkjpathania.dependencyrisk.graph.model;

public record GraphSummary(
    long trippleCount, long applicationCount, long packageCount, long dependencyEdgeCount) {}
