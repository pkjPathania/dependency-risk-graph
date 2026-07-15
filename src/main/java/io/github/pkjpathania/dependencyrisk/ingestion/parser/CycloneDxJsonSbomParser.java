package io.github.pkjpathania.dependencyrisk.ingestion.parser;

import io.github.pkjpathania.dependencyrisk.ingestion.model.DependencyEdge;
import io.github.pkjpathania.dependencyrisk.ingestion.model.NormalizedSbom;
import io.github.pkjpathania.dependencyrisk.ingestion.model.PackageComponent;
import java.io.BufferedInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.cyclonedx.model.Bom;
import org.cyclonedx.parsers.BomParserFactory;
import org.cyclonedx.parsers.Parser;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public final class CycloneDxJsonSbomParser implements SbomParser {

  @Override
  public NormalizedSbom parse(InputStream inputStream) {
    try (InputStream bis = new BufferedInputStream(inputStream)) {
      bis.mark(Integer.MAX_VALUE);
      Parser parser = BomParserFactory.createParser(bis.readAllBytes());
      bis.reset();
      Bom bom = parser.parse(bis);

      String applicationName =
          Objects.nonNull(bom.getMetadata()) && Objects.nonNull(bom.getMetadata().getComponent())
              ? bom.getMetadata().getComponent().getName()
              : "unknown";

      String applicationVersion =
          Objects.nonNull(bom.getMetadata()) && Objects.nonNull(bom.getMetadata().getComponent())
              ? bom.getMetadata().getComponent().getVersion()
              : null;

      List<PackageComponent> components =
          Objects.isNull(bom.getComponents())
              ? List.of()
              : bom.getComponents().stream()
                  .map(
                      component ->
                          new PackageComponent(
                              component.getBomRef(),
                              component.getGroup(),
                              component.getName(),
                              component.getVersion(),
                              component.getPurl(),
                              Objects.nonNull(component.getType())
                                  ? component.getType().name()
                                  : null))
                  .toList();

      List<DependencyEdge> dependencies =
          Objects.isNull(bom.getDependencies())
              ? List.of()
              : bom.getDependencies().stream()
                  .map(
                      dependency ->
                          new DependencyEdge(
                              dependency.getRef(),
                              Objects.isNull(dependency.getDependencies())
                                  ? List.of()
                                  : dependency.getDependencies().stream()
                                      .map(child -> child.getRef())
                                      .toList()))
                  .toList();

      return new NormalizedSbom(applicationName, applicationVersion, components, dependencies);
    } catch (Exception ex) {
      log.error("Failed to parse with reason ", ex);
      throw new IllegalStateException("Failed to parse CycloneDX SBOM", ex);
    }
  }
}
