package io.github.pkjpathania.dependencyrisk.workbench.graphql.mapper;

import io.github.pkjpathania.dependencyrisk.graph.util.SparqlUtil;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.ApplicationOccurrence;
import java.util.function.Function;
import org.apache.jena.query.QuerySolution;

public final class ApplicationOccurrenceMapper {

  public static Function<QuerySolution, ApplicationOccurrence> applicationMapper() {
    return qs ->
        ApplicationOccurrence.builder()
            .id(SparqlUtil.get(qs, "applicationOccurrence"))
            .componentType(SparqlUtil.get(qs, "componentType"))
            .group(SparqlUtil.get(qs, "group"))
            .name(SparqlUtil.get(qs, "name"))
            .version(SparqlUtil.get(qs, "version"))
            .build();
  }
}
