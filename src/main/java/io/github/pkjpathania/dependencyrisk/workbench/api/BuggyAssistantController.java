package io.github.pkjpathania.dependencyrisk.workbench.api;

import io.github.pkjpathania.dependencyrisk.workbench.config.BuggyAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workbench/buggy")
@RequiredArgsConstructor
public class BuggyAssistantController {
  private final BuggyAssistantService assistantService;

  @GetMapping("/ask")
  public ResponseEntity<?> ask(@RequestParam String question) {
    return ResponseEntity.ok(assistantService.ask(question));
  }
}
