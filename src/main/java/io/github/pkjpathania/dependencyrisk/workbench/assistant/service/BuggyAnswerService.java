package io.github.pkjpathania.dependencyrisk.workbench.assistant.service;

import dev.langchain4j.model.chat.ChatModel;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.BuggyPromptFactory;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.model.BuggyAnswerRequest;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.model.BuggyAnswerResponse;
import io.github.pkjpathania.dependencyrisk.workbench.config.BuggyModelProperties;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceIndexService;
import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceMatch;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

@Service
@RequiredArgsConstructor
public class BuggyAnswerService {

  private final BuggyModelProperties properties;

  private final AdvisoryEvidenceIndexService evidenceIndexService;
  private final BuggyPromptFactory promptFactory;
  private final ChatModel chatModel;

  public BuggyAnswerResponse answer(BuggyAnswerRequest request) {
    String question = StringUtils.trimToNull(request.question());
    if (question == null) throw new IllegalArgumentException("Question cannot be blank");

    int maxResults = request.maxResults() > 0 ? request.maxResults() : 5;
    double minScore = request.minScore() > 0 ? request.minScore() : 0.55;

    List<AdvisoryEvidenceMatch> matches =
        evidenceIndexService.search(question, maxResults, minScore);

    if (CollectionUtils.isEmpty(matches))
      return new BuggyAnswerResponse(
          question,
          "I couldn't find enough advisory evidence to answer that question.",
          List.of(),
          null,
          null);

    String prompt = promptFactory.create(question, matches);

    String answer = chatModel.chat(prompt);
    final String model = properties.provider() + ":" + properties.modelName();

    return new BuggyAnswerResponse(question, answer, matches, null, model);
  }
}
