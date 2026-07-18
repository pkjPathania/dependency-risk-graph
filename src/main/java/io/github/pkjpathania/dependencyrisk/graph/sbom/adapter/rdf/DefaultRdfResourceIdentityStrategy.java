package io.github.pkjpathania.dependencyrisk.graph.sbom.adapter.rdf;

import com.github.packageurl.MalformedPackageURLException;
import com.github.packageurl.PackageURL;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ImportedBomIdentity;
import io.github.pkjpathania.dependencyrisk.graph.sbom.domain.ResourceIdentity;
import io.github.pkjpathania.dependencyrisk.util.GenUtil;
import java.util.Optional;
import org.apache.commons.lang3.StringUtils;
import org.cyclonedx.model.Component;

@org.springframework.stereotype.Component
public final class DefaultRdfResourceIdentityStrategy
    implements RdfResourceIdentityStrategy {
  private static final String RESOURCE_NS =
      "urn:io.github.pkjpathania.dependencyrisk:resource:";

  @Override
  public ResourceIdentity identifyOccurrence(String importId, String bomRef) {
    return new ResourceIdentity(importScopedIri("occurrence", importId, bomRef), bomRef, null);
  }

  @Override
  public Optional<ResourceIdentity> identifyPackageVersion(Component component) {
    String canonicalPurl = canonicalPurl(component.getPurl());
    return Optional.ofNullable(canonicalPurl)
        .map(
            purl ->
                new ResourceIdentity(
                    RESOURCE_NS + "package:" + GenUtil.sha256(purl), null, purl));
  }

  @Override
  public ResourceIdentity identifyApplication(Component component, String fallbackIdentity) {
    String canonicalPurl = canonicalPurl(component.getPurl());
    String identity = canonicalPurl == null ? fallbackIdentity : canonicalPurl;
    return new ResourceIdentity(
        RESOURCE_NS + "application:" + GenUtil.sha256(identity), component.getBomRef(), canonicalPurl);
  }

  @Override
  public ResourceIdentity identifyImport(ImportedBomIdentity identity) {
    return new ResourceIdentity(RESOURCE_NS + "import:" + identity.importId(), null, null);
  }

  private String importScopedIri(String kind, String importId, String bomRef) {
    return RESOURCE_NS + kind + ":" + GenUtil.sha256(importId + "\u0000" + bomRef);
  }

  private String canonicalPurl(String purl) {
    if (StringUtils.isBlank(purl)) {
      return null;
    }
    try {
      PackageURL packageUrl = new PackageURL(purl);
      return StringUtils.isBlank(packageUrl.getVersion()) ? null : packageUrl.canonicalize();
    } catch (MalformedPackageURLException exception) {
      return null;
    }
  }
}
