package io.github.pkjpathania.dependencyrisk.workbench.assistant;

import io.github.pkjpathania.dependencyrisk.workbench.evidence.AdvisoryEvidenceMatch;
import java.util.List;
import java.util.Locale;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class BuggyPromptFactory {

  public String create(String question, List<AdvisoryEvidenceMatch> evidence) {

    String normalizedQuestion = StringUtils.trimToNull(question);

    if (normalizedQuestion == null) {
      throw new IllegalArgumentException("Question must not be blank");
    }

    if (evidence == null || evidence.isEmpty()) {
      throw new IllegalArgumentException("Advisory evidence must not be empty");
    }

    StringBuilder prompt =
        new StringBuilder(
            """
            You are Buggy, an expert software supply-chain security assistant.

            Answer the user's question using only the supplied advisory evidence.

            Rules:
            - Never invent vulnerabilities, packages, versions, severity, impact, or remediation.
            - Never guess.
            - If the evidence is insufficient, clearly state that.
            - Use concise and precise technical language.
            - Mention the relevant vulnerability identifier when available.
            - Do not treat the similarity score as confidence.
            - Do not combine facts from unrelated vulnerabilities.
            - Do not determine whether an application is affected; application dependency facts are not supplied here.
            - Do not include a sarcastic closing verdict. The application adds that separately.

            User question:
            """);

    prompt.append(normalizedQuestion).append("\n\n");
    prompt.append("Retrieved advisory evidence:\n\n");

    int index = 1;

    for (AdvisoryEvidenceMatch match : evidence) {
      prompt.append("--- Evidence ").append(index++).append(" ---\n");

      prompt.append("Document ID: ").append(match.id()).append('\n');

      prompt.append("Vulnerability ID: ").append(match.vulnerabilityId()).append('\n');

      prompt.append("Section: ").append(match.segmentType()).append('\n');

      prompt
          .append("Similarity score: ")
          .append(String.format(Locale.ROOT, "%.3f", match.score()))
          .append("\n\n");

      prompt.append(match.text()).append("\n");
      prompt.append("--- End evidence ---\n\n");
    }

    prompt.append(
        """
        Produce a direct answer grounded only in the evidence above.

        Answer:
        """);

    return prompt.toString();
  }
}
