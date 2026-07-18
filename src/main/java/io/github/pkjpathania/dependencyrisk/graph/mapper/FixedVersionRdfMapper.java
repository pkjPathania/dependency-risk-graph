package io.github.pkjpathania.dependencyrisk.graph.mapper;

import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.vulnerability.client.model.response.OsvVulnerabilityResponse;
import io.github.pkjpathania.dependencyrisk.vulnerability.iri.RiskResourceIriFactory;
import io.github.pkjpathania.dependencyrisk.vulnerability.model.PackageScanTarget;
import java.util.List;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;

public final class FixedVersionRdfMapper {

  private FixedVersionRdfMapper() {}

  public static void map(
      Model model,
      Resource vulnerabilityResource,
      PackageScanTarget packageTarget,
      OsvVulnerabilityResponse vulnerability) {

    model.removeAll(vulnerabilityResource, RiskVocabulary.FIXED_IN, null);

    List<String> fixedVersions = OsvFixedVersionExtractor.extract(packageTarget, vulnerability);

    for (String fixedVersion : fixedVersions) {
      Resource fixedPackage =
          model.createResource(
              RiskResourceIriFactory.fixedPackageVersion(
                  packageIdentity(packageTarget), fixedVersion));

      model.add(fixedPackage, RDF.type, RiskVocabulary.PACKAGE_VERSION);

      RdfValueWriter.replaceLiteral(
          model, fixedPackage, RDFS.label, packageTarget.packageName());

      RdfValueWriter.replaceLiteral(model, fixedPackage, RiskVocabulary.VERSION, fixedVersion);

      RdfValueWriter.replaceLiteral(
          model, fixedPackage, RiskVocabulary.PURL, fixedPurl(packageTarget.purl(), fixedVersion));

      model.add(vulnerabilityResource, RiskVocabulary.FIXED_IN, fixedPackage);
    }
  }

  private static String packageIdentity(PackageScanTarget packageTarget) {
    if (StringUtils.isNotBlank(packageTarget.packageName())) {
      return packageTarget.packageName().trim();
    }
    return packageTarget.purl().trim();
  }

  private static String fixedPurl(String vulnerablePurl, String fixedVersion) {
    if (StringUtils.isBlank(vulnerablePurl)
        || StringUtils.isBlank(fixedVersion)
        || fixedVersion.chars().anyMatch(Character::isWhitespace)
        || fixedVersion.indexOf('?') >= 0
        || fixedVersion.indexOf('#') >= 0) {
      return null;
    }

    String purl = vulnerablePurl.trim();
    if (!purl.startsWith("pkg:")) {
      return null;
    }
    int queryIndex = purl.indexOf('?');
    int fragmentIndex = purl.indexOf('#');
    int coordinatesEnd = purl.length();
    if (queryIndex >= 0) {
      coordinatesEnd = queryIndex;
    }
    if (fragmentIndex >= 0) {
      coordinatesEnd = Math.min(coordinatesEnd, fragmentIndex);
    }

    int versionIndex = purl.lastIndexOf('@', coordinatesEnd - 1);
    int finalPathSeparator = purl.lastIndexOf('/', coordinatesEnd - 1);
    if (versionIndex <= finalPathSeparator || versionIndex == coordinatesEnd - 1) {
      return null;
    }

    return purl.substring(0, versionIndex + 1)
        + fixedVersion.trim()
        + purl.substring(coordinatesEnd);
  }
}
