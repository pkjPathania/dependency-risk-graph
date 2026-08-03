package io.github.pkjpathania.dependencyrisk.graph.util;

import com.github.packageurl.MalformedPackageURLException;
import com.github.packageurl.PackageURL;
import io.github.pkjpathania.dependencyrisk.util.ArqAlgebraUtil;
import java.util.Objects;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.Syntax;
import org.apache.jena.rdf.model.RDFNode;

public class SparqlUtil {
  public static String format(String query) {
    if (StringUtils.isBlank(query)) throw new IllegalStateException("No query found");

    Query sparql = QueryFactory.create(query, Syntax.syntaxSPARQL_11);
    return sparql.serialize(Syntax.syntaxSPARQL_11);
  }

  public static Query from(String query) {
    return QueryFactory.create(query, Syntax.syntaxSPARQL_11);
  }

  public static Query selectOnly(String query) {
    Query valid = from(query);
    if (!valid.isSelectType()) throw new IllegalStateException("Only select are supported");

    return valid;
  }

  public static String trimPurl(String purl) {
    try {
      return new PackageURL(purl).getCoordinates();
    } catch (MalformedPackageURLException e) {
      throw new IllegalArgumentException("Invalid package URL: " + purl, e);
    }
  }

  public static String get(QuerySolution qs, String variable) {
    Objects.requireNonNull(qs, "querySolution must not be null or empty");
    Objects.requireNonNull(variable, "missing variable name");

    RDFNode node = qs.get(variable);
    if (Objects.isNull(node)) return null;

    if (node.isResource()) return node.asResource().getURI();
    if (node.isLiteral()) return node.asLiteral().getString();

    if (node.isAnon()) return "_" + node.asResource().getId().getLabelString();

    return node.toString();
  }

  public ArqAlgebraUtil.ArqAlgebra of(String query){
    return ArqAlgebraUtil.inspect(query);
  }
}
