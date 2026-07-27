package io.github.pkjpathania.dependencyrisk.workbench.assistant.mapper;

import io.github.pkjpathania.dependencyrisk.graph.util.SparqlUtil;
import io.github.pkjpathania.dependencyrisk.workbench.assistant.model.ImpactedServices;
import java.util.function.Function;
import org.apache.jena.query.QuerySolution;

public class AssistantRdfMapper {

  public static Function<QuerySolution, ImpactedServices> impactedServices() {
    return qs -> new ImpactedServices(SparqlUtil.get(qs, "name"), SparqlUtil.get(qs, "purl"));
  }
}
