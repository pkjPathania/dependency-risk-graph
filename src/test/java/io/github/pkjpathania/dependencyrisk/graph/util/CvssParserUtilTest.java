package io.github.pkjpathania.dependencyrisk.graph.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import us.springett.cvss.Cvss;
import us.springett.cvss.CvssV2;
import us.springett.cvss.CvssV3;
import us.springett.cvss.CvssV3_1;
import us.springett.cvss.CvssV4;

class CvssParserUtilTest {

  @Test
  void returnsConcreteCvssObject() {
    Cvss cvss =
        CvssParserUtil.from(
            "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");

    assertEquals(CvssV3_1.class, cvss.getClass());
    assertEquals("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", cvss.getVector());
    assertEquals(9.8, cvss.calculateScore().getBaseScore());
  }

  @Test
  void returnsConcreteObjectsForEverySupportedVersion() {
    assertEquals(
        CvssV4.class,
        CvssParserUtil.from(
                "CVSS:4.0/AV:L/AC:L/AT:P/PR:L/UI:P/VC:L/VI:H/VA:L/SC:L/SI:H/SA:L/RE:L/U:Clear")
            .getClass());
    assertEquals(
        CvssV3_1.class,
        CvssParserUtil.from(
                "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")
            .getClass());
    assertEquals(
        CvssV3.class,
        CvssParserUtil.from(
                "CVSS:3.0/AV:L/AC:H/PR:L/UI:R/S:U/C:L/I:L/A:L")
            .getClass());
    assertEquals(
        CvssV2.class,
        CvssParserUtil.from("AV:N/AC:L/Au:N/C:C/I:C/A:C").getClass());
  }

  @Test
  void returnsNullForMissingOrMalformedVector() {
    assertNull(CvssParserUtil.from(null));
    assertNull(CvssParserUtil.from(" "));
    assertNull(CvssParserUtil.from("not-a-cvss-vector"));
  }
}
