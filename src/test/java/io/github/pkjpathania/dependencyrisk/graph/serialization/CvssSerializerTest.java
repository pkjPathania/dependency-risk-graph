package io.github.pkjpathania.dependencyrisk.graph.serialization;

import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.pkjpathania.dependencyrisk.graph.model.CvssAssessmentView;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import us.springett.cvss.Cvss;

class CvssSerializerTest {

  @Test
  void serializesTheCompleteConcreteV4Object() throws Exception {
    Cvss cvss =
        Cvss.fromVector(
            "CVSS:4.0/AV:L/AC:L/AT:P/PR:L/UI:P/VC:L/VI:H/VA:L/SC:L/SI:H/SA:L/RE:L/U:Clear");

    String json =
        new ObjectMapper()
            .writeValueAsString(new CvssAssessmentView("urn:test:assessment", "CVSS_V4", cvss));

    assertTrue(json.contains("\"implementation\":\"CvssV4\""));
    assertTrue(json.contains("\"vector\":\"CVSS:4.0/"));
    assertTrue(json.contains("\"severity\":"));
    assertTrue(json.contains("\"score\":{\"base\":"));
    assertTrue(json.contains("\"av\":\"LOCAL\""));
    assertTrue(json.contains("\"at\":\"PRESENT\""));
    assertTrue(json.contains("\"ui\":\"PASSIVE\""));
    assertTrue(json.contains("\"e\":\"NOT_DEFINED\""));
    assertTrue(json.contains("\"mav\":\"NOT_DEFINED\""));
    assertTrue(json.contains("\"re\":\"LOW\""));
    assertTrue(json.contains("\"u\":\"CLEAR\""));
  }
}
