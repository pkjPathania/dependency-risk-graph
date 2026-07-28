package io.github.pkjpathania.dependencyrisk.workbench.graphql.mapper;

import io.github.pkjpathania.dependencyrisk.graph.util.SparqlUtil;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.PackageOccurrence;
import java.util.function.Function;
import org.apache.jena.query.QuerySolution;

public final class PackageOccurrenceMapper {
  public static Function<QuerySolution, PackageOccurrence> map() {
    return qs ->
        PackageOccurrence.builder()
            .id(SparqlUtil.get(qs, "packageOccurrence"))
            .bomRef(SparqlUtil.get(qs, "bomRef"))
            .componentType(SparqlUtil.get(qs, "componentType"))
            .name(SparqlUtil.get(qs, "name"))
            .rdfType(SparqlUtil.get(qs, "rdfType"))
            .group(SparqlUtil.get(qs, "group"))
            .purl(SparqlUtil.get(qs, "purl"))
            .version(SparqlUtil.get(qs, "version"))
            .build();
  }
}
