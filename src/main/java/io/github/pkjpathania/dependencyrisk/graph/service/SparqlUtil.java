package io.github.pkjpathania.dependencyrisk.graph.service;

import org.apache.commons.lang3.StringUtils;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.Syntax;

public class SparqlUtil {
  public static String format(String query) {
    if (StringUtils.isBlank(query)) throw new IllegalStateException("No query found");

    Query sparql = QueryFactory.create(query, Syntax.syntaxSPARQL_11);
    return sparql.serialize(Syntax.syntaxSPARQL_11);
  }

  public static Query from(String query) {
    return QueryFactory.create(query, Syntax.syntaxSPARQL_11);
  }
}
