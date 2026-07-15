package io.github.pkjpathania.dependencyrisk.ingestion.parser;

import io.github.pkjpathania.dependencyrisk.ingestion.model.NormalizedSbom;
import java.io.InputStream;

public sealed interface SbomParser permits CycloneDxJsonSbomParser {
  NormalizedSbom parse(InputStream inputStream);
}
