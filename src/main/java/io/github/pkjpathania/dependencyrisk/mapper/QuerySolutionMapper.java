package io.github.pkjpathania.dependencyrisk.mapper;

import io.github.pkjpathania.dependencyrisk.graph.model.AffectedPackage;
import java.util.function.Function;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.rdf.model.RDFNode;

public class QuerySolutionMapper {

  private static String stringValue(QuerySolution qs, String variable) {
    RDFNode node = qs.get(variable);

    if (node == null) {
      return null;
    }

    if (node.isLiteral()) {
      return node.asLiteral().getString();
    }

    if (node.isResource() && node.asResource().isURIResource()) {
      return node.asResource().getURI();
    }

    return node.toString();
  }

  public static Function<QuerySolution, AffectedPackage> affectedPackage() {
    return qs ->
        new AffectedPackage(
            stringValue(qs, "package"),
            stringValue(qs, "packageName"),
            stringValue(qs, "version"),
            stringValue(qs, "purl"),
            stringValue(qs, "vulnerability"),
            stringValue(qs, "osvId"));
  }
}
