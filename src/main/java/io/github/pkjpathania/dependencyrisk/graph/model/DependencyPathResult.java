package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.List;

public record DependencyPathResult(boolean found, int hops, List<DependencyNode> path) {}
