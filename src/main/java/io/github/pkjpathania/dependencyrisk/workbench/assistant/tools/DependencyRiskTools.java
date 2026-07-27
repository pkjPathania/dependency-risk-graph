package io.github.pkjpathania.dependencyrisk.workbench.assistant.tools;

import dev.langchain4j.agent.tool.Tool;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.model.ImpactedApplicationsResult;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.service.AssistantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DependencyRiskTools {
  private final AssistantService assistantService;

  @Tool(
"""
   Finds every application impacted by at least one known vulnerability
      through a direct or transitive dependency.

      Use this tool when the user asks:
      - how many applications are impacted
      - which applications are impacted
      - whether any applications are impacted

      The returned total and application identities are authoritative.
      Do not estimate or infer the count without using this tool.
""")
  public ImpactedApplicationsResult impactedServices() {
    return assistantService.impactedServices();
  }
}
