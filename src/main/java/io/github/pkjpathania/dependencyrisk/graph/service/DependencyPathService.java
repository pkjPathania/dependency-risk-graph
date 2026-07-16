package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.enums.NodeType;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyGraphSnapshot;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyNode;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathResult;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyVertex;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.NoSuchElementException;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.jgrapht.GraphPath;
import org.jgrapht.alg.shortestpath.BFSShortestPath;
import org.jgrapht.graph.DefaultEdge;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DependencyPathService {
  private final DependencyGraphIndex graphIndex;

  public DependencyPathResult shortest(String packageName, String version) {
    DependencyGraphSnapshot snapshot = graphIndex.current();

    DependencyVertex source = findApplication(snapshot);
    DependencyVertex target = findPackage(snapshot, packageName, version);

    GraphPath<DependencyVertex, DefaultEdge> path =
        new BFSShortestPath<>(snapshot.graph()).getPath(source, target);

    if (Objects.isNull(path)) return new DependencyPathResult(false, 0, List.of());

    List<DependencyNode> nodes =
        path.getVertexList().stream().map(snapshot.metadata()::get).toList();
    return new DependencyPathResult(true, path.getLength(), nodes);
  }

  private DependencyVertex findApplication(DependencyGraphSnapshot snapshot) {
    return snapshot.metadata().entrySet().stream()
        .filter(entry -> entry.getValue().type() == NodeType.APPLICATION)
        .map(Entry::getKey)
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("Application node not found"));
  }

  private DependencyVertex findPackage(
      DependencyGraphSnapshot snapshot, String label, String version) {
    List<DependencyVertex> matches =
        snapshot.metadata().entrySet().stream()
            .filter(entry -> entry.getValue().type() == NodeType.PACKAGE_VERSION)
            .filter(entry -> label.equals(entry.getValue().label()))
            .filter(entry -> version == null || version.equals(entry.getValue().version()))
            .map(Map.Entry::getKey)
            .toList();

    if (matches.isEmpty()) {
      throw new NoSuchElementException("Package not found: " + label);
    }

    if (matches.size() > 1) {
      throw new IllegalArgumentException("Multiple versions found; provide the version");
    }

    return matches.getFirst();
  }
}
