package io.github.pkjpathania.dependencyrisk.graph.model;

import java.util.Map;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;

public record DependencyGraphSnapshot(
    Graph<DependencyVertex, DefaultEdge> graph, Map<DependencyVertex, DependencyNode> metadata) {}
