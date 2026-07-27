package io.github.pkjpathania.dependencyrisk.workbench.assistant.contract;

import dev.langchain4j.service.Result;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

public interface AssistantContract {

  @SystemMessage(
      """
      You are a software supply-chain risk assistant.

      Use the available tools whenever the answer depends on the dependency
      knowledge graph or vulnerability data.

      Never invent application counts, dependency relationships,
      vulnerabilities, versions, dependency paths, severity scores,
      or remediation versions.

      Base factual security claims only on tool results.

      When a tool returns a total, use that exact total.
      If evidence is insufficient, state what evidence is missing.
        """)
  Result<String> answer(@UserMessage String question);
}
