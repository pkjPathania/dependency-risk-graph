package io.github.pkjpathania.dependencyrisk.ingestion.service;

import io.github.pkjpathania.dependencyrisk.ingestion.model.NormalizedSbom;
import io.github.pkjpathania.dependencyrisk.ingestion.parser.SbomParser;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class SbomIngestionService {
  private final SbomParser parser;

  public NormalizedSbom ingest(MultipartFile file) {
    if (Objects.isNull(file) || file.isEmpty()) {
      throw new IllegalArgumentException("SBOM file is required");
    }

    try (InputStream inputStream = file.getInputStream()) {
      return parser.parse(inputStream);
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to read SBOM file", exception);
    }
  }
}
