package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNullPointerException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AdvisoryEvidenceDocumentTest {

  @Test
  void trimsValidValues() {
    AdvisoryEvidenceDocument document =
        new AdvisoryEvidenceDocument(
            " document-1 ",
            " CVE-2026-1234 ",
            AdvisoryEvidenceSegmentType.OVERVIEW,
            " Advisory overview ");

    assertThat(document.id()).isEqualTo("document-1");
    assertThat(document.vulnerabilityId()).isEqualTo("CVE-2026-1234");
    assertThat(document.text()).isEqualTo("Advisory overview");
  }

  @Test
  void rejectsBlankId() {
    assertThatThrownBy(
            () ->
                new AdvisoryEvidenceDocument(
                    " ",
                    "CVE-2026-1234",
                    AdvisoryEvidenceSegmentType.OVERVIEW,
                    "Advisory overview"))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void rejectsBlankVulnerabilityId() {
    assertThatThrownBy(
            () ->
                new AdvisoryEvidenceDocument(
                    "document-1",
                    " ",
                    AdvisoryEvidenceSegmentType.OVERVIEW,
                    "Advisory overview"))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void rejectsNullSegmentType() {
    assertThatNullPointerException()
        .isThrownBy(
            () ->
                new AdvisoryEvidenceDocument(
                    "document-1", "CVE-2026-1234", null, "Advisory overview"));
  }

  @Test
  void rejectsBlankText() {
    assertThatThrownBy(
            () ->
                new AdvisoryEvidenceDocument(
                    "document-1",
                    "CVE-2026-1234",
                    AdvisoryEvidenceSegmentType.OVERVIEW,
                    " "))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
