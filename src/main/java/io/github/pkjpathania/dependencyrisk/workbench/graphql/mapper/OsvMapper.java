package io.github.pkjpathania.dependencyrisk.workbench.graphql.mapper;

import io.github.pkjpathania.dependencyrisk.graph.util.SparqlUtil;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.Osv;
import java.util.List;
import java.util.function.Function;
import org.apache.jena.query.QuerySolution;

public final class OsvMapper {
  public static Function<QuerySolution, Osv> map() {
    return qs ->
        Osv.builder()
            .osvId(SparqlUtil.get(qs, "osvId"))
            .aliases(alias(qs))
            .summary(SparqlUtil.get(qs, "summary"))
            .details(SparqlUtil.get(qs, "details"))
            .publishedAt(SparqlUtil.get(qs, "publishedAt"))
            .modifiedAt(SparqlUtil.get(qs, "modifiedAt"))
            .withdrawnAt(SparqlUtil.get(qs, "withdrawnAt"))
            .build();
  }

  private static List<String> alias(QuerySolution querySolution) {
    String alias = SparqlUtil.get(querySolution, "alias");
    return alias == null ? List.of() : List.of(alias);
  }
}
