package io.github.pkjpathania.dependencyrisk.graph.repo;

import io.github.pkjpathania.dependencyrisk.graph.model.GraphMetadata;
import io.github.pkjpathania.dependencyrisk.graph.model.GraphSummary;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.io.IOException;
import java.io.StringWriter;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import org.apache.jena.query.Dataset;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.RDFFormat;
import org.apache.jena.vocabulary.RDF;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.ObjectMapper;

@Repository
@RequiredArgsConstructor
public class JenaGraphRepository {
  private final Dataset dataset;
  private final ObjectMapper objectMapper;

  private static String modelToString(Model model) {
    try (StringWriter writer = new StringWriter()) {
      RDFDataMgr.write(writer, model, RDFFormat.JSONLD_PRETTY);
      return writer.toString();
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public void saveAll(Model model) {
    dataset.executeWrite(
        () -> {
          dataset.getDefaultModel().removeAll();
          dataset.getDefaultModel().add(model);
        });
  }

  public Model getModel() {
    Model detached = ModelFactory.createDefaultModel();
    detached.add(dataset.getDefaultModel());
    detached.setNsPrefixes(dataset.getDefaultModel().getNsPrefixMap());
    return detached;
  }

  public GraphMetadata getMetadata() {

    AtomicReference<GraphMetadata> metadata = new AtomicReference<>();
    dataset.executeRead(
        () -> {
          Model model = dataset.getDefaultModel();
          GraphSummary summary =
              new GraphSummary(
                  model.size(),
                  model
                      .listResourcesWithProperty(RDF.type, RiskVocabulary.APPLICATION)
                      .toList()
                      .size(),
                  model
                      .listResourcesWithProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
                      .toList()
                      .size(),
                  model
                      .listStatements(null, RiskVocabulary.DEPENDS_ON, (RDFNode) null)
                      .toList()
                      .size());
          String payload = modelToString(model);
          metadata.set(new GraphMetadata(summary, objectMapper.readTree(payload)));
        });
    return metadata.get();
  }
}
