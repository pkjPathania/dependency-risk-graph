package io.github.pkjpathania.dependencyrisk.workbench.assistant.api;

import io.github.pkjpathania.dependencyrisk.workbench.assistant.model.BuggyAnswerRequest;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.model.BuggyAnswerResponse;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.service.BuggyAnswerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workbench/assistant")
@RequiredArgsConstructor
public class BuggyController {

  private final BuggyAnswerService buggyAnswerService;

  @PostMapping("/evidence")
  public BuggyAnswerResponse ask(@RequestBody BuggyAnswerRequest request) {

    return buggyAnswerService.answer(request);
  }
}
