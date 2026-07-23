package io.github.pkjpathania.dependencyrisk.graph.util;

import us.springett.cvss.Cvss;
import us.springett.cvss.MalformedVectorException;

public final class CvssParserUtil {

  private CvssParserUtil() {}

  public static Cvss from(String vector) {
    if (vector == null || vector.isBlank()) {
      return null;
    }
    try {
      return Cvss.fromVector(vector.trim());
    } catch (MalformedVectorException exception) {
      return null;
    }
  }

  public static String severity(double baseScore) {
    if (baseScore == 0) {
      return "NONE";
    }
    if (baseScore < 4) {
      return "LOW";
    }
    if (baseScore < 7) {
      return "MEDIUM";
    }
    if (baseScore < 9) {
      return "HIGH";
    }
    return "CRITICAL";
  }
}
