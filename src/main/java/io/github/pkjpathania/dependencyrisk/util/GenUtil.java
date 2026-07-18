package io.github.pkjpathania.dependencyrisk.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import tools.jackson.databind.ObjectMapper;

public class GenUtil {
  private static final ObjectMapper OM = new ObjectMapper();

  public static String sha256(String value) {
    return sha256Bytes(value.getBytes(StandardCharsets.UTF_8));
  }

  public static String sha256Bytes(byte[] value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(value);

      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is not available", exception);
    }
  }

  public static String toJson(Object o) {
    return OM.writeValueAsString(o);
  }
}
