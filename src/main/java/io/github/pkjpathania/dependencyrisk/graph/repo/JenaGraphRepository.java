package io.github.pkjpathania.dependencyrisk.graph.repo;

import io.github.pkjpathania.dependencyrisk.graph.enums.NodeType;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyGraphSnapshot;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyNode;
import io.github.pkjpathania.dependencyrisk.graph.model.DependencyVertex;
import io.github.pkjpathania.dependencyrisk.graph.model.GraphMetadata;
import io.github.pkjpathania.dependencyrisk.graph.model.GraphSummary;
import io.github.pkjpathania.dependencyrisk.graph.model.SparqlSelectResponse;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.RDFFormat;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;
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

  public SparqlSelectResponse of(Query query) {
    return dataset.calculateRead(
        () -> {
          try (QueryExecution qe = QueryExecution.dataset(dataset).query(query).build()) {
            ResultSet rs = qe.execSelect();
            List<String> columns = rs.getResultVars();

            List<Map<String, String>> rows = new ArrayList<>();

            while (rs.hasNext()) {
              QuerySolution qs = rs.next();
              Map<String, String> row = new LinkedHashMap<>();

              for (String column : columns) {
                RDFNode node = qs.get(column);
                row.put(column, Objects.nonNull(node) ? node.toString() : null);
              }
              rows.add(row);
            }

            return new SparqlSelectResponse(columns, rows);
          }
        });
  }

  public DependencyGraphSnapshot build() {
    return dataset.calculateRead(
        () -> {
          Graph<DependencyVertex, DefaultEdge> graph =
              new DefaultDirectedGraph<>(DefaultEdge.class);

          Map<DependencyVertex, DependencyNode> metadata = new HashMap<>();

          Model model = dataset.getDefaultModel();

          StmtIterator statements =
              model.listStatements(null, RiskVocabulary.DEPENDS_ON, (RDFNode) null);

          while (statements.hasNext()) {
            Statement statement = statements.next();

            if (!statement.getObject().isResource()) {
              continue;
            }

            Resource sourceResource = statement.getSubject();
            Resource targetResource = statement.getObject().asResource();

            DependencyVertex source = new DependencyVertex(sourceResource.getURI());

            DependencyVertex target = new DependencyVertex(targetResource.getURI());

            graph.addVertex(source);
            graph.addVertex(target);

            metadata.computeIfAbsent(source, ignored -> toMetadata(model, sourceResource));

            metadata.computeIfAbsent(target, ignored -> toMetadata(model, targetResource));

            if (!graph.containsEdge(source, target)) {
              graph.addEdge(source, target);
            }
          }

          return new DependencyGraphSnapshot(graph, Map.copyOf(metadata));
        });
  }

  private DependencyNode toMetadata(Model model, Resource resource) {
    String label = literalValue(resource, RDFS.label);
    String version = literalValue(resource, RiskVocabulary.VERSION);
    String purl = literalValue(resource, RiskVocabulary.PURL);
    NodeType type =
        model.contains(resource, RDF.type, RiskVocabulary.APPLICATION)
            ? NodeType.APPLICATION
            : NodeType.PACKAGE_VERSION;

    return new DependencyNode(resource.getURI(), label, version, purl, type);
  }

  private String literalValue(Resource resource, Property property) {
    Statement statement = resource.getProperty(property);

    if (statement == null || !statement.getObject().isLiteral()) {
      return null;
    }

    return statement.getString();
  }
}
