package io.github.pkjpathania.dependencyrisk.graph.sbom.application;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public final class UuidImportIdGenerator implements ImportIdGenerator {
  @Override
  public String generate() {
    return UUID.randomUUID().toString();
  }
}
