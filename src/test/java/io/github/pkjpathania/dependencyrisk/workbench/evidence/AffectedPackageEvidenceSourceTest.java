package io.github.pkjpathania.dependencyrisk.workbench.evidence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AffectedPackageEvidenceSourceTest {

  @Test
  void requiresIri() {
    assertThatThrownBy(() -> new AffectedPackageEvidenceSource(" ", null, null, null, null))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void trimsRequiredIri() {
    AffectedPackageEvidenceSource source =
        new AffectedPackageEvidenceSource(" urn:package:1 ", null, null, null, null);

    assertThat(source.iri()).isEqualTo("urn:package:1");
  }

  @Test
  void trimsOptionalValues() {
    AffectedPackageEvidenceSource source =
        new AffectedPackageEvidenceSource(
            "urn:package:1",
            " example ",
            " pkg:maven/example/example@1.0 ",
            " Maven ",
            " https://example.test/advisory ");

    assertThat(source.name()).isEqualTo("example");
    assertThat(source.purl()).isEqualTo("pkg:maven/example/example@1.0");
    assertThat(source.ecosystem()).isEqualTo("Maven");
    assertThat(source.sourceUrl()).isEqualTo("https://example.test/advisory");
  }

  @Test
  void convertsBlankOptionalValuesToNull() {
    AffectedPackageEvidenceSource source =
        new AffectedPackageEvidenceSource("urn:package:1", " ", "\t", "\n", "  ");

    assertThat(source.name()).isNull();
    assertThat(source.purl()).isNull();
    assertThat(source.ecosystem()).isNull();
    assertThat(source.sourceUrl()).isNull();
  }
}
