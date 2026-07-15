package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.mapper.SbomRdfMapper;
import io.github.pkjpathania.dependencyrisk.graph.model.GraphSummary;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import io.github.pkjpathania.dependencyrisk.ingestion.model.NormalizedSbom;
import io.github.pkjpathania.dependencyrisk.ingestion.service.SbomIngestionService;
import java.io.IOException;
import java.io.StringWriter;
import lombok.RequiredArgsConstructor;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.RDFFormat;
import org.apache.jena.vocabulary.RDF;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class RdfExportService {
  private final SbomRdfMapper mapper;
  private final SbomIngestionService parser;

  private final JenaGraphRepository jenaGraphRepository;

  public String toJsonLd(NormalizedSbom sbom) {
    Model model = mapper.map(sbom);
    jenaGraphRepository.saveAll(model);

    try (StringWriter writer = new StringWriter()) {
      RDFDataMgr.write(writer, model, RDFFormat.JSONLD_PRETTY);
      return writer.toString();
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public GraphSummary newGraph(MultipartFile file) {
    NormalizedSbom sbom = parser.ingest(file);
    Model model = mapper.map(sbom);
    jenaGraphRepository.saveAll(model);

    return new GraphSummary(
        model.size(),
        model.listResourcesWithProperty(RDF.type, RiskVocabulary.APPLICATION).toList().size(),
        model.listResourcesWithProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION).toList().size(),
        model.listStatements(null, RiskVocabulary.DEPENDS_ON, (RDFNode) null).toList().size());
  }

  public String toJsonLd(MultipartFile file) {
    NormalizedSbom parsed = parser.ingest(file);
    return toJsonLd(parsed);
  }
}
