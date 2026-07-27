package io.github.pkjpathania.dependencyrisk.workbench.assistant.util;

public class AssistantQueryUtil {

  private static final String PREFIX =
      """
                                        PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>
                                        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                                        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                                        PREFIX owl: <http://www.w3.org/2002/07/owl#>
                                        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                                      """;

  public static String listImpactedServices() {

    return PREFIX
        + """
                                                         SELECT DISTINCT  ?name ?purl
                                                         WHERE
                                                           { ?app  a  risk:ApplicationOccurrence .
                                                             ?app (risk:dependsOn)+ ?pkg .
                                                             ?app  risk:name        ?name ;
                                                                   risk:purl        ?purl .
                                                             ?pkg  risk:affectedBy  ?vuln
                                                           }
                                                         """;
  }
}
