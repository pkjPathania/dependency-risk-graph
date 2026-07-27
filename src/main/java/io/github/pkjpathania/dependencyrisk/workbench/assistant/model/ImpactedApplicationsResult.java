package io.github.pkjpathania.dependencyrisk.workbench.assistant.model;

import java.util.List;

public record ImpactedApplicationsResult(int total, List<ImpactedServices> impactedServices) {
  public static ImpactedApplicationsResult from(List<ImpactedServices> impactedServices) {
    return new ImpactedApplicationsResult(impactedServices.size(), impactedServices);
  }
}
