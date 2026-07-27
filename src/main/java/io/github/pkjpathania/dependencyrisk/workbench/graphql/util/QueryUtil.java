package io.github.pkjpathania.dependencyrisk.workbench.graphql.util;

public class QueryUtil {

  public static class ApplicationOccurrence {
    public static final String GET_ALL_APPLICATIONS =
        """
                                                    PREFIX  rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                                                    PREFIX  risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

                                                    SELECT DISTINCT  ?applicationOccurrence ?componentType ?group ?name ?version
                                                    WHERE
                                                      { ?applicationOccurrence
                                                                  rdf:type  risk:ApplicationOccurrence
                                                        OPTIONAL
                                                          { ?applicationOccurrence
                                                                      risk:componentType  ?componentType
                                                          }
                                                        OPTIONAL
                                                          { ?applicationOccurrence
                                                                      risk:group  ?group
                                                          }
                                                        OPTIONAL
                                                          { ?applicationOccurrence
                                                                      risk:name  ?name
                                                          }
                                                        OPTIONAL
                                                          { ?applicationOccurrence
                                                                      risk:version  ?version
                                                          }
                                                      }
                                                    ORDER BY ?applicationOccurrence
                                                    """;
  }
}
