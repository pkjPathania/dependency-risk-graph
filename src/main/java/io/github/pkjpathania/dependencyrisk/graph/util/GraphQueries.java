package io.github.pkjpathania.dependencyrisk.graph.util;

public class GraphQueries {

  public static final String FIND_ALL_AFFECTED_PACKAGES =
      """
                                                         PREFIX  risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

                                                         SELECT DISTINCT  ?package ?packageName ?version ?purl ?vulnerability ?osvId
                                                         WHERE
                                                           { ?package  a                risk:PackageOccurrence ;
                                                                       risk:affectedBy  ?vulnerability .
                                                             ?vulnerability
                                                                       a                risk:Vulnerability ;
                                                                       risk:osvId       ?osvId
                                                             OPTIONAL
                                                               { ?package  risk:name  ?packageName }
                                                             OPTIONAL
                                                               { ?package  risk:version  ?version }
                                                             OPTIONAL
                                                               { ?package  risk:purl  ?purl }
                                                           }
                                                         ORDER BY lcase(str(?packageName)) str(?version) str(?osvId)
                                                         """;
}
