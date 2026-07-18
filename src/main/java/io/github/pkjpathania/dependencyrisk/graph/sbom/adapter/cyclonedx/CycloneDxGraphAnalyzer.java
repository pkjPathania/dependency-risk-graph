package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.cyclonedx;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.DependencyInformationStatus;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.DuplicateBomRefIssue;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.GraphQualityIssue;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.GraphQualityStatus;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ImportIssue;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.IssueSeverity;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportDiagnostics;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.UnresolvedReferenceIssue;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import org.apache.commons.lang3.StringUtils;
import org.cyclonedx.model.Bom;
import org.cyclonedx.model.Component;
import org.cyclonedx.model.Dependency;
import org.cyclonedx.model.Service;

@org.springframework.stereotype.Component
public final class CycloneDxGraphAnalyzer {

  public SbomImportDiagnostics analyze(Bom bom, String declaredSpecVersion) {
    List<Component> components = allComponents(bom);
    List<Service> services = allServices(bom);
    List<ImportIssue> issues = new ArrayList<>();
    Set<String> knownRefs = new LinkedHashSet<>();
    int duplicateCount = indexRefs(components, services, knownRefs, issues);
    DependencyAnalysis dependencyAnalysis = analyzeDependencies(bom, knownRefs, issues);

    String rootRef = rootComponent(bom) == null ? null : rootComponent(bom).getBomRef();
    Reachability reachability = traverse(rootRef, dependencyAnalysis.childrenByParent());
    Map<String, DependencyInformationStatus> information = new LinkedHashMap<>();
    for (String ref : knownRefs) {
      information.put(ref, dependencyStatus(ref, dependencyAnalysis.childrenByParent()));
    }
    int unknownCount =
        (int)
            information.values().stream()
                .filter(value -> value == DependencyInformationStatus.DEPENDENCY_INFORMATION_UNKNOWN)
                .count();
    int unreachableComponents =
        (int)
            components.stream()
                .map(Component::getBomRef)
                .filter(StringUtils::isNotBlank)
                .distinct()
                .filter(ref -> !reachability.visited().contains(ref))
                .count();
    int withPurl = (int) components.stream().filter(c -> StringUtils.isNotBlank(c.getPurl())).count();
    GraphQualityStatus quality =
        classify(bom, rootRef, dependencyAnalysis, unknownCount);
    if (quality != GraphQualityStatus.USABLE_DEPENDENCY_GRAPH) {
      issues.add(
          new GraphQualityIssue(
              IssueSeverity.WARNING,
              quality,
              "Imported graph quality is " + quality));
    }

    return new SbomImportDiagnostics(
        declaredSpecVersion,
        rootRef,
        rootComponent(bom) == null ? null : rootComponent(bom).getName(),
        rootComponent(bom) == null ? null : rootComponent(bom).getVersion(),
        dependencyAnalysis.childrenByParent().containsKey(rootRef),
        components.size(),
        services.size(),
        safe(bom.getDependencies()).size(),
        dependencyAnalysis.edgeCount(),
        dependencyAnalysis.nonEmptyEntryCount(),
        dependencyAnalysis.declaredLeafCount(),
        unknownCount,
        dependencyAnalysis.unresolvedReferences().size(),
        duplicateCount,
        withPurl,
        components.size() - withPurl,
        reachability.visited().size(),
        unreachableComponents,
        reachability.maximumDepth(),
        0,
        0,
        quality,
        information,
        issues);
  }

  public List<Component> allComponents(Bom bom) {
    List<Component> result = new ArrayList<>();
    Component root = rootComponent(bom);
    if (root != null) {
      result.add(root);
    }
    flattenComponents(safe(bom.getComponents()), result);
    return List.copyOf(result);
  }

  public List<Service> allServices(Bom bom) {
    List<Service> result = new ArrayList<>();
    flattenServices(safe(bom.getServices()), result);
    return List.copyOf(result);
  }

  private int indexRefs(
      List<Component> components,
      List<Service> services,
      Set<String> knownRefs,
      List<ImportIssue> issues) {
    int duplicates = 0;
    for (String ref :
        java.util.stream.Stream.concat(
                components.stream().map(Component::getBomRef),
                services.stream().map(Service::getBomRef))
            .filter(StringUtils::isNotBlank)
            .toList()) {
      if (!knownRefs.add(ref)) {
        duplicates++;
        issues.add(
            new DuplicateBomRefIssue(
                IssueSeverity.WARNING, ref, "Duplicate bom-ref in CycloneDX document: " + ref));
      }
    }
    return duplicates;
  }

  private DependencyAnalysis analyzeDependencies(
      Bom bom, Set<String> knownRefs, List<ImportIssue> issues) {
    Map<String, Set<String>> children = new LinkedHashMap<>();
    Set<String> unresolved = new LinkedHashSet<>();
    int edges = 0;
    int nonEmpty = 0;
    int leaves = 0;
    for (Dependency dependency : safe(bom.getDependencies())) {
      String parent = dependency.getRef();
      Set<String> direct = children.computeIfAbsent(parent, ignored -> new LinkedHashSet<>());
      List<Dependency> declaredChildren = safe(dependency.getDependencies());
      if (declaredChildren.isEmpty()) {
        leaves++;
      } else {
        nonEmpty++;
      }
      if (!knownRefs.contains(parent)) {
        recordUnresolved(parent, parent, unresolved, issues);
      }
      for (Dependency child : declaredChildren) {
        String childRef = child.getRef();
        if (direct.add(childRef)) {
          edges++;
        }
        if (!knownRefs.contains(childRef)) {
          recordUnresolved(parent, childRef, unresolved, issues);
        }
      }
    }
    return new DependencyAnalysis(children, unresolved, edges, nonEmpty, leaves);
  }

  private void recordUnresolved(
      String parent,
      String child,
      Set<String> unresolved,
      List<ImportIssue> issues) {
    if (unresolved.add(child)) {
      issues.add(
          new UnresolvedReferenceIssue(
              IssueSeverity.WARNING,
              parent,
              child,
              "Dependency references unknown bom-ref: " + child));
    }
  }

  private Reachability traverse(String rootRef, Map<String, Set<String>> children) {
    if (StringUtils.isBlank(rootRef)) {
      return new Reachability(Set.of(), 0);
    }
    Queue<NodeAtDepth> queue = new ArrayDeque<>();
    Set<String> visited = new LinkedHashSet<>();
    queue.add(new NodeAtDepth(rootRef, 0));
    visited.add(rootRef);
    int maxDepth = 0;
    while (!queue.isEmpty()) {
      NodeAtDepth current = queue.remove();
      maxDepth = Math.max(maxDepth, current.depth());
      for (String child : children.getOrDefault(current.ref(), Set.of())) {
        if (visited.add(child)) {
          queue.add(new NodeAtDepth(child, current.depth() + 1));
        }
      }
    }
    return new Reachability(Set.copyOf(visited), maxDepth);
  }

  private GraphQualityStatus classify(
      Bom bom,
      String rootRef,
      DependencyAnalysis analysis,
      int unknownCount) {
    if (analysis.childrenByParent().isEmpty()) {
      return GraphQualityStatus.NO_DEPENDENCY_GRAPH;
    }
    if (!analysis.unresolvedReferences().isEmpty()) {
      return GraphQualityStatus.GRAPH_WITH_UNRESOLVED_REFERENCES;
    }
    if (analysis.childrenByParent().size() == 1
        && analysis.childrenByParent().containsKey(rootRef)
        && analysis.childrenByParent().get(rootRef).isEmpty()) {
      return GraphQualityStatus.ROOT_ONLY_GRAPH;
    }
    if (isRootWithDeclaredLeafChildren(rootRef, analysis.childrenByParent())) {
      return GraphQualityStatus.MODULE_ONLY_GRAPH;
    }
    if (safe(bom.getCompositions()).isEmpty() || unknownCount > 0) {
      return GraphQualityStatus.GRAPH_COMPLETENESS_UNSPECIFIED;
    }
    return GraphQualityStatus.USABLE_DEPENDENCY_GRAPH;
  }

  private boolean isRootWithDeclaredLeafChildren(
      String rootRef, Map<String, Set<String>> children) {
    Set<String> rootChildren = children.get(rootRef);
    if (rootChildren == null || rootChildren.isEmpty()) {
      return false;
    }
    Set<String> expectedEntries = new LinkedHashSet<>(rootChildren);
    expectedEntries.add(rootRef);
    return children.keySet().equals(expectedEntries)
        && rootChildren.stream()
            .allMatch(child -> children.containsKey(child) && children.get(child).isEmpty());
  }

  private DependencyInformationStatus dependencyStatus(
      String ref, Map<String, Set<String>> children) {
    if (!children.containsKey(ref)) {
      return DependencyInformationStatus.DEPENDENCY_INFORMATION_UNKNOWN;
    }
    return children.get(ref).isEmpty()
        ? DependencyInformationStatus.DECLARED_LEAF
        : DependencyInformationStatus.GRAPH_ENTRY_WITH_DEPENDENCIES;
  }

  private Component rootComponent(Bom bom) {
    return bom.getMetadata() == null ? null : bom.getMetadata().getComponent();
  }

  private void flattenComponents(List<Component> source, List<Component> target) {
    for (Component component : source) {
      target.add(component);
      flattenComponents(safe(component.getComponents()), target);
    }
  }

  private void flattenServices(List<Service> source, List<Service> target) {
    for (Service service : source) {
      target.add(service);
      flattenServices(safe(service.getServices()), target);
    }
  }

  private static <T> List<T> safe(List<T> values) {
    return values == null ? List.of() : values;
  }

  private record DependencyAnalysis(
      Map<String, Set<String>> childrenByParent,
      Set<String> unresolvedReferences,
      int edgeCount,
      int nonEmptyEntryCount,
      int declaredLeafCount) {}

  private record Reachability(Set<String> visited, int maximumDepth) {}

  private record NodeAtDepth(String ref, int depth) {}
}
