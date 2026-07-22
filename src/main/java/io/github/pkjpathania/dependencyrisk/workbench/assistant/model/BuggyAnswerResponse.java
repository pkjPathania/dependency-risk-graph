package io.github.pkjpathania.dependencyrisk.workbench.assistant.model;

import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceMatch;
import java.util.List;

public record BuggyAnswerResponse(
    String question,
    String answer,
    List<AdvisoryEvidenceMatch> evidence,
    String finalSnitch,
    String model
) {}
