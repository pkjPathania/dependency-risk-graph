package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.cyclonedx;

import io.github.pkjpathania.dependencyrisk.graph.sbom.exception.UnsupportedCycloneDxVersionException;
import java.util.List;
import org.cyclonedx.Format;
import org.cyclonedx.Version;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class DefaultCycloneDxVersionPolicy implements CycloneDxVersionPolicy {
  private static final List<String> SUPPORTED =
      List.of("1.2", "1.3", "1.4", "1.5", "1.6");

  private final String installedLibraryVersion;

  public DefaultCycloneDxVersionPolicy(
      @Value("${dependency-risk.cyclonedx-core-version:12.2.0}")
          String installedLibraryVersion) {
    this.installedLibraryVersion = installedLibraryVersion;
  }

  @Override
  public CycloneDxSchemaVersion resolve(String declaredVersion) {
    Version version = Version.fromVersionString(declaredVersion);
    if (version == null || !version.getFormats().contains(Format.JSON) || !isSupported(declaredVersion)) {
      throw new UnsupportedCycloneDxVersionException(
          "Unsupported CycloneDX specification version '"
              + declaredVersion
              + "'; supported JSON versions are "
              + SUPPORTED
              + "; installed CycloneDX Core Java version is "
              + installedLibraryVersion);
    }
    return new CycloneDxSchemaVersion(declaredVersion, version);
  }

  @Override
  public boolean isSupported(String declaredVersion) {
    return SUPPORTED.contains(declaredVersion);
  }
}
