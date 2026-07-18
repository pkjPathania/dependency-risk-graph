package io.github.pkjpathania.dependencyrisk.graph.sbom.domain;

import java.util.List;
import java.util.Map;

public record SbomImportDiagnostics(
    String declaredSpecVersion,
    String rootBomRef,
    String rootName,
    String rootVersion,
    boolean rootDependencyEntryFound,
    int componentCount,
    int serviceCount,
    int dependencyEntryCount,
    int dependencyEdgeCount,
    int nonEmptyDependencyEntryCount,
    int declaredLeafCount,
    int unknownDependencyInformationCount,
    int unresolvedReferenceCount,
    int duplicateBomRefCount,
    int componentsWithPurl,
    int componentsWithoutPurl,
    int reachableNodeCount,
    int unreachableComponentCount,
    int maximumReachableDepth,
    int externalComponentCount,
    int internalModuleCount,
    GraphQualityStatus graphQuality,
    Map<String, DependencyInformationStatus> dependencyInformationByBomRef,
    List<ImportIssue> issues) {
  public SbomImportDiagnostics {
    dependencyInformationByBomRef = Map.copyOf(dependencyInformationByBomRef);
    issues = List.copyOf(issues);
  }
}
