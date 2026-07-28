package io.github.pkjpathania.dependencyrisk.workbench.config;

import io.github.pkjpathania.dependencyrisk.workbench.assistant.service.GraphQlBuggyAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BuggyAssistantService {
  private final GraphQlBuggyAssistantService graphQlAssistantService;

  public String ask(String question) {
    return graphQlAssistantService.ask(question);
  }
}
