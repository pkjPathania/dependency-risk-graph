package io.github.pkjpathania.dependencyrisk.util;

import java.util.Objects;

import org.apache.jena.query.Query;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.Syntax;
import org.apache.jena.sparql.algebra.Algebra;
import org.apache.jena.sparql.algebra.Op;
import org.apache.jena.sparql.algebra.OpAsQuery;
import org.apache.jena.sparql.sse.SSE;

public final class ArqAlgebraUtil {

  private ArqAlgebraUtil() {}

  /** Parses the SPARQL query and returns its unoptimised ARQ algebra. */
  public static Op compile(String sparql) {
    Query query = parse(sparql);
    return Algebra.compile(query);
  }

  /** Parses, compiles and applies ARQ's static algebra optimisations. */
  public static Op compileOptimized(String sparql) {
    Op compiled = compile(sparql);
    return Algebra.optimize(compiled);
  }

  /** Returns the raw algebra rendered as SSE. */
  public static String rawSse(String sparql) {
    return SSE.str(compile(sparql));
  }

  /** Returns the statically optimised algebra rendered as SSE. */
  public static String optimizedSse(String sparql) {
    return SSE.str(compileOptimized(sparql));
  }

  /** Returns both the raw and optimised algebra. */
  public static ArqAlgebra inspect(String sparql) {
    Query query = parse(sparql);

    Op raw = Algebra.compile(query);
    Op optimized = Algebra.optimize(raw);

    return new ArqAlgebra(query, raw, optimized, SSE.str(raw), SSE.str(optimized));
  }

  /** Converts an algebra expression back into an equivalent SPARQL query. */
  public static String toSparql(Op op) {
    Objects.requireNonNull(op, "op must not be null");

    return OpAsQuery.asQuery(op).serialize();
  }

  private static Query parse(String sparql) {
    if (sparql == null || sparql.isBlank()) {
      throw new IllegalArgumentException("SPARQL query must not be null or blank");
    }

    return QueryFactory.create(sparql, Syntax.syntaxARQ);
  }

  public record ArqAlgebra(Query query, Op raw, Op optimized, String rawSse, String optimizedSse) {}
}
