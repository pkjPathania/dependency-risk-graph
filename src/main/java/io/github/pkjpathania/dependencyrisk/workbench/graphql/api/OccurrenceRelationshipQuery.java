package io.github.pkjpathania.dependencyrisk.workbench.graphql.api;

import io.github.pkjpathania.dependencyrisk.workbench.annotations.GraphQlController;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.ApplicationOccurrence;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.PackageOccurrence;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.Vulnerability;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.service.ApplicationOccurrenceService;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.service.PackageOccurrenceService;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.service.VulnerabilityGraphQlService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.BatchMapping;

@GraphQlController
@RequiredArgsConstructor
public class OccurrenceRelationshipQuery {
  private final ApplicationOccurrenceService applicationOccurrenceService;
  private final PackageOccurrenceService packageOccurrenceService;
  private final VulnerabilityGraphQlService vulnerabilityService;

  @BatchMapping(typeName = "ApplicationOccurrence", field = "packages", maxBatchSize = 256)
  public Map<ApplicationOccurrence, List<PackageOccurrence>> packages(
      List<ApplicationOccurrence> applications) {
    Map<String, List<PackageOccurrence>> packagesByApplication =
        packageOccurrenceService.findByApplications(
            applications.stream().map(ApplicationOccurrence::getId).toList());
    Map<ApplicationOccurrence, List<PackageOccurrence>> result = new LinkedHashMap<>();
    applications.forEach(
        application ->
            result.put(
                application,
                packagesByApplication.getOrDefault(application.getId(), List.of())));
    return result;
  }

  @BatchMapping(typeName = "ApplicationOccurrence", field = "vulnerabilities", maxBatchSize = 256)
  public Map<ApplicationOccurrence, List<Vulnerability>> vulnerabilitiesByApplication(
      List<ApplicationOccurrence> applications) {
    Map<String, List<Vulnerability>> vulnerabilitiesByApplication =
        vulnerabilityService.findByApplications(
            applications.stream().map(ApplicationOccurrence::getId).toList());
    Map<ApplicationOccurrence, List<Vulnerability>> result = new LinkedHashMap<>();
    applications.forEach(
        application ->
            result.put(
                application,
                vulnerabilitiesByApplication.getOrDefault(application.getId(), List.of())));
    return result;
  }

  @BatchMapping(typeName = "PackageOccurrence", field = "applications", maxBatchSize = 256)
  public Map<PackageOccurrence, List<ApplicationOccurrence>> applications(
      List<PackageOccurrence> packages) {
    Map<String, List<ApplicationOccurrence>> applicationsByPackage =
        applicationOccurrenceService.findByPackages(
            packages.stream().map(PackageOccurrence::getId).toList());
    Map<PackageOccurrence, List<ApplicationOccurrence>> result = new LinkedHashMap<>();
    packages.forEach(
        packageOccurrence ->
            result.put(
                packageOccurrence,
                applicationsByPackage.getOrDefault(packageOccurrence.getId(), List.of())));
    return result;
  }

  @BatchMapping(typeName = "PackageOccurrence", field = "vulnerabilities", maxBatchSize = 256)
  public Map<PackageOccurrence, List<Vulnerability>> vulnerabilities(
      List<PackageOccurrence> packages) {
    Map<String, List<Vulnerability>> vulnerabilitiesByPackage =
        vulnerabilityService.findByPackages(
            packages.stream().map(PackageOccurrence::getId).toList());
    Map<PackageOccurrence, List<Vulnerability>> result = new LinkedHashMap<>();
    packages.forEach(
        packageOccurrence ->
            result.put(
                packageOccurrence,
                vulnerabilitiesByPackage.getOrDefault(packageOccurrence.getId(), List.of())));
    return result;
  }

  @BatchMapping(typeName = "Vulnerability", field = "packages", maxBatchSize = 256)
  public Map<Vulnerability, List<PackageOccurrence>> packagesByVulnerability(
      List<Vulnerability> vulnerabilities) {
    Map<String, List<PackageOccurrence>> packagesByVulnerability =
        packageOccurrenceService.findByVulnerabilities(
            vulnerabilities.stream().map(Vulnerability::getId).toList());
    Map<Vulnerability, List<PackageOccurrence>> result = new LinkedHashMap<>();
    vulnerabilities.forEach(
        vulnerability ->
            result.put(
                vulnerability,
                packagesByVulnerability.getOrDefault(vulnerability.getId(), List.of())));
    return result;
  }

  @BatchMapping(typeName = "Vulnerability", field = "applications", maxBatchSize = 256)
  public Map<Vulnerability, List<ApplicationOccurrence>> applicationsByVulnerability(
      List<Vulnerability> vulnerabilities) {
    Map<String, List<ApplicationOccurrence>> applicationsByVulnerability =
        applicationOccurrenceService.findByVulnerabilities(
            vulnerabilities.stream().map(Vulnerability::getId).toList());
    Map<Vulnerability, List<ApplicationOccurrence>> result = new LinkedHashMap<>();
    vulnerabilities.forEach(
        vulnerability ->
            result.put(
                vulnerability,
                applicationsByVulnerability.getOrDefault(vulnerability.getId(), List.of())));
    return result;
  }
}
