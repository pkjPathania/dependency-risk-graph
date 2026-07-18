package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ImportIssue;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.SbomImportDiagnostics;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

final class SbomImportDiagnosticsCollector {
  private final SbomImportDiagnostics base;
  private final List<ImportIssue> issues;
  private final Set<String> issueKeys = new LinkedHashSet<>();

  SbomImportDiagnosticsCollector(SbomImportDiagnostics base) {
    this.base = base;
    this.issues = new ArrayList<>(base.issues());
    base.issues().forEach(issue -> issueKeys.add(key(issue)));
  }

  void addIssue(ImportIssue issue) {
    if (issueKeys.add(key(issue))) {
      issues.add(issue);
    }
  }

  SbomImportDiagnostics snapshot() {
    return new SbomImportDiagnostics(
        base.declaredSpecVersion(),
        base.rootBomRef(),
        base.rootName(),
        base.rootVersion(),
        base.rootDependencyEntryFound(),
        base.componentCount(),
        base.serviceCount(),
        base.dependencyEntryCount(),
        base.dependencyEdgeCount(),
        base.nonEmptyDependencyEntryCount(),
        base.declaredLeafCount(),
        base.unknownDependencyInformationCount(),
        base.unresolvedReferenceCount(),
        base.duplicateBomRefCount(),
        base.componentsWithPurl(),
        base.componentsWithoutPurl(),
        base.reachableNodeCount(),
        base.unreachableComponentCount(),
        base.maximumReachableDepth(),
        base.externalComponentCount(),
        base.internalModuleCount(),
        base.graphQuality(),
        base.dependencyInformationByBomRef(),
        List.copyOf(issues));
  }

  private String key(ImportIssue issue) {
    return issue.code() + "\u0000" + issue.message();
  }
}
