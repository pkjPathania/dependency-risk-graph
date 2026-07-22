package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNullPointerException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class AdvisoryEvidenceSourceTest {

  @Test
  void requiresVulnerabilityIri() {
    assertThatThrownBy(() -> source(" ", "CVE-2026-1234", null, null, null, null))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void requiresVulnerabilityId() {
    assertThatThrownBy(() -> source("urn:vulnerability:1", " ", null, null, null, null))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void trimsDeduplicatesAndSortsAliases() {
    AdvisoryEvidenceSource source =
        source(
            " urn:vulnerability:1 ",
            " CVE-2026-1234 ",
            List.of(" GHSA-bbbb ", "CVE-2026-1234", "GHSA-aaaa", "GHSA-bbbb", " "),
            null,
            null,
            null);

    assertThat(source.vulnerabilityIri()).isEqualTo("urn:vulnerability:1");
    assertThat(source.vulnerabilityId()).isEqualTo("CVE-2026-1234");
    assertThat(source.aliases())
        .containsExactly("CVE-2026-1234", "GHSA-aaaa", "GHSA-bbbb");
  }

  @Test
  void removesNullAliases() {
    List<String> aliases = new ArrayList<>();
    aliases.add("GHSA-aaaa");
    aliases.add(null);

    assertThat(source("urn:vulnerability:1", "CVE-2026-1234", aliases, null, null, null).aliases())
        .containsExactly("GHSA-aaaa");
  }

  @Test
  void convertsNullAliasesToAnEmptyImmutableList() {
    List<String> aliases =
        source("urn:vulnerability:1", "CVE-2026-1234", null, null, null, null).aliases();

    assertThat(aliases).isEmpty();
    assertThatThrownBy(() -> aliases.add("GHSA-aaaa"))
        .isInstanceOf(UnsupportedOperationException.class);
  }

  @Test
  void convertsNullAffectedPackagesToAnEmptyImmutableList() {
    List<AffectedPackageEvidenceSource> affectedPackages =
        source("urn:vulnerability:1", "CVE-2026-1234", null, null, null, null)
            .affectedPackages();

    assertThat(affectedPackages).isEmpty();
    assertThatThrownBy(
            () ->
                affectedPackages.add(
                    new AffectedPackageEvidenceSource("urn:package:1", null, null, null, null)))
        .isInstanceOf(UnsupportedOperationException.class);
  }

  @Test
  void preservesAllAffectedPackagesWithTheSamePurl() {
    AffectedPackageEvidenceSource first =
        new AffectedPackageEvidenceSource(
            "urn:package:1", null, "pkg:maven/example/example@1.0", null, null);
    AffectedPackageEvidenceSource second =
        new AffectedPackageEvidenceSource(
            "urn:package:2", null, "pkg:maven/example/example@1.0", null, null);

    AdvisoryEvidenceSource source =
        source(
            "urn:vulnerability:1",
            "CVE-2026-1234",
            null,
            null,
            null,
            List.of(first, second));

    assertThat(source.affectedPackages()).containsExactly(first, second);
  }

  @Test
  void rejectsNullAffectedPackageEntries() {
    List<AffectedPackageEvidenceSource> affectedPackages = new ArrayList<>();
    affectedPackages.add(null);

    assertThatNullPointerException()
        .isThrownBy(
            () ->
                source(
                    "urn:vulnerability:1",
                    "CVE-2026-1234",
                    null,
                    null,
                    null,
                    affectedPackages));
  }

  @Test
  void trimsSummaryAndDetails() {
    AdvisoryEvidenceSource source =
        source(
            "urn:vulnerability:1",
            "CVE-2026-1234",
            null,
            " Summary ",
            " Details ",
            null);

    assertThat(source.summary()).isEqualTo("Summary");
    assertThat(source.details()).isEqualTo("Details");
  }

  @Test
  void convertsBlankSummaryAndDetailsToNull() {
    AdvisoryEvidenceSource source =
        source(
            "urn:vulnerability:1", "CVE-2026-1234", null, " ", "\t", null);

    assertThat(source.summary()).isNull();
    assertThat(source.details()).isNull();
  }

  private static AdvisoryEvidenceSource source(
      String vulnerabilityIri,
      String vulnerabilityId,
      List<String> aliases,
      String summary,
      String details,
      List<AffectedPackageEvidenceSource> affectedPackages) {
    return new AdvisoryEvidenceSource(
        vulnerabilityIri,
        vulnerabilityId,
        aliases,
        summary,
        details,
        affectedPackages);
  }
}
