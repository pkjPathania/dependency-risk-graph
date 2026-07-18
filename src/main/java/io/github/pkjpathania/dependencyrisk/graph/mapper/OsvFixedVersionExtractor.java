package io.github.pkjpathania.dependencyrisk.graph.mapper;

import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvAffected;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvRange;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvRangeEvent;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvVulnerabilityResponse;
import io.github.pkjpathania.dependencyrisk.vulnerability.model.PackageScanTarget;
import java.util.LinkedHashSet;
import java.util.List;
import org.apache.commons.lang3.StringUtils;

public final class OsvFixedVersionExtractor {

  private OsvFixedVersionExtractor() {}

  public static List<String> extract(
      PackageScanTarget packageTarget, OsvVulnerabilityResponse vulnerability) {

    LinkedHashSet<String> versions = new LinkedHashSet<>();

    for (OsvAffected affected : vulnerability.affected()) {
      if (affected == null || !matchesPackage(packageTarget, affected)) {
        continue;
      }

      for (OsvRange range : affected.ranges()) {
        if (range == null) {
          continue;
        }

        for (OsvRangeEvent event : range.events()) {
          if (event != null && StringUtils.isNotBlank(event.fixed())) {
            versions.add(event.fixed().trim());
          }
        }
      }
    }

    return List.copyOf(versions);
  }

  private static boolean matchesPackage(PackageScanTarget target, OsvAffected affected) {
    if (affected.packageInfo() == null) {
      return false;
    }

    String targetPurl = normalizePurl(target.purl());
    String affectedPurl = normalizePurl(affected.packageInfo().purl());
    if (StringUtils.isNotBlank(targetPurl) && StringUtils.isNotBlank(affectedPurl)) {
      return targetPurl.equalsIgnoreCase(affectedPurl);
    }

    return StringUtils.isNotBlank(target.packageName())
        && StringUtils.isNotBlank(affected.packageInfo().name())
        && target.packageName().trim().equalsIgnoreCase(affected.packageInfo().name().trim());
  }

  private static String normalizePurl(String purl) {
    if (StringUtils.isBlank(purl)) {
      return null;
    }

    String value = purl.trim();
    int suffixIndex = firstSuffixIndex(value);
    String coordinates = value.substring(0, suffixIndex);
    int versionIndex = coordinates.lastIndexOf('@');
    int finalPathSeparator = coordinates.lastIndexOf('/');
    if (versionIndex > finalPathSeparator) {
      coordinates = coordinates.substring(0, versionIndex);
    }
    return coordinates;
  }

  private static int firstSuffixIndex(String value) {
    int queryIndex = value.indexOf('?');
    int fragmentIndex = value.indexOf('#');
    int end = value.length();
    if (queryIndex >= 0) {
      end = queryIndex;
    }
    if (fragmentIndex >= 0) {
      end = Math.min(end, fragmentIndex);
    }
    return end;
  }
}
