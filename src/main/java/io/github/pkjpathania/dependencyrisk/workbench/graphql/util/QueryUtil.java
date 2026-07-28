package io.github.pkjpathania.dependencyrisk.workbench.graphql.util;

public final class QueryUtil {

  private static final String PREFIXES =
      """
      PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>
      """;

  private QueryUtil() {}

  public static final class ApplicationOccurrence {
    public static final String GET_ALL =
        PREFIXES
            + """
            SELECT DISTINCT
              ?applicationOccurrence ?rdfType ?bomRef ?componentType ?group ?name ?version
            WHERE {
              ?applicationOccurrence rdf:type risk:ApplicationOccurrence .
              BIND(risk:ApplicationOccurrence AS ?rdfType)
              OPTIONAL { ?applicationOccurrence risk:bomRef ?bomRef . }
              OPTIONAL { ?applicationOccurrence risk:componentType ?componentType . }
              OPTIONAL { ?applicationOccurrence risk:group ?group . }
              OPTIONAL { ?applicationOccurrence risk:name ?name . }
              OPTIONAL { ?applicationOccurrence risk:version ?version . }
            }
            ORDER BY ?applicationOccurrence
            """;

    public static final String GET_BY_ID =
        PREFIXES
            + """
            SELECT DISTINCT
              ?applicationOccurrence ?rdfType ?bomRef ?componentType ?group ?name ?version
            WHERE {
              VALUES ?applicationOccurrence { ?applicationValue }
              ?applicationOccurrence rdf:type risk:ApplicationOccurrence .
              BIND(risk:ApplicationOccurrence AS ?rdfType)
              OPTIONAL { ?applicationOccurrence risk:bomRef ?bomRef . }
              OPTIONAL { ?applicationOccurrence risk:componentType ?componentType . }
              OPTIONAL { ?applicationOccurrence risk:group ?group . }
              OPTIONAL { ?applicationOccurrence risk:name ?name . }
              OPTIONAL { ?applicationOccurrence risk:version ?version . }
            }
            LIMIT 1
            """;

    public static String getByPackages(int batchSize) {
      return PREFIXES
          + """
          SELECT DISTINCT
            ?packageOccurrence ?applicationOccurrence ?rdfType ?bomRef ?componentType ?group ?name ?version
          WHERE {
          """
          + values("packageOccurrence", "packageValue", batchSize)
          + """
            ?applicationOccurrence rdf:type risk:ApplicationOccurrence ;
                                   risk:dependsOn+ ?packageOccurrence .
            BIND(risk:ApplicationOccurrence AS ?rdfType)
            OPTIONAL { ?applicationOccurrence risk:bomRef ?bomRef . }
            OPTIONAL { ?applicationOccurrence risk:componentType ?componentType . }
            OPTIONAL { ?applicationOccurrence risk:group ?group . }
            OPTIONAL { ?applicationOccurrence risk:name ?name . }
            OPTIONAL { ?applicationOccurrence risk:version ?version . }
          }
          ORDER BY ?packageOccurrence ?applicationOccurrence
          """;
    }

    public static String getByVulnerabilities(int batchSize) {
      return PREFIXES
          + """
          SELECT DISTINCT
            ?vulnerability ?applicationOccurrence ?rdfType ?bomRef ?componentType ?group ?name ?version
          WHERE {
          """
          + values("vulnerability", "vulnerabilityValue", batchSize)
          + """
            ?applicationOccurrence rdf:type risk:ApplicationOccurrence ;
                                   risk:dependsOn+ ?packageOccurrence .
            ?packageOccurrence risk:affectedBy ?vulnerability .
            BIND(risk:ApplicationOccurrence AS ?rdfType)
            OPTIONAL { ?applicationOccurrence risk:bomRef ?bomRef . }
            OPTIONAL { ?applicationOccurrence risk:componentType ?componentType . }
            OPTIONAL { ?applicationOccurrence risk:group ?group . }
            OPTIONAL { ?applicationOccurrence risk:name ?name . }
            OPTIONAL { ?applicationOccurrence risk:version ?version . }
          }
          ORDER BY ?vulnerability ?applicationOccurrence
          """;
    }

    private ApplicationOccurrence() {}
  }

  public static final class PackageOccurrence {
    public static final String GET_ALL = packageQuery("");
    public static final String GET_BY_ID =
        packageQuery("VALUES ?requestedPackage { ?packageValue } FILTER(?packageOccurrence = ?requestedPackage)")
            + "LIMIT 1\n";

    public static String getByApplications(int batchSize) {
      return PREFIXES
          + """
          SELECT DISTINCT
            ?application ?packageOccurrence ?rdfType ?bomRef ?name ?group ?version ?purl ?componentType
          WHERE {
          """
          + values("application", "applicationValue", batchSize)
          + """
            ?application risk:dependsOn+ ?packageOccurrence .
            ?packageOccurrence rdf:type ?rdfType .
            FILTER(?rdfType = risk:PackageOccurrence)
            OPTIONAL { ?packageOccurrence risk:bomRef ?bomRef . }
            OPTIONAL { ?packageOccurrence risk:name ?name . }
            OPTIONAL { ?packageOccurrence risk:group ?group . }
            OPTIONAL { ?packageOccurrence risk:version ?version . }
            OPTIONAL { ?packageOccurrence risk:purl ?purl . }
            OPTIONAL { ?packageOccurrence risk:componentType ?componentType . }
          }
          ORDER BY ?application ?name ?version ?packageOccurrence
          """;
    }

    public static String getByVulnerabilities(int batchSize) {
      return PREFIXES
          + """
          SELECT DISTINCT
            ?vulnerability ?packageOccurrence ?rdfType ?bomRef ?name ?group ?version ?purl ?componentType
          WHERE {
          """
          + values("vulnerability", "vulnerabilityValue", batchSize)
          + """
            ?packageOccurrence rdf:type ?rdfType ;
                               risk:affectedBy ?vulnerability .
            FILTER(?rdfType = risk:PackageOccurrence)
            OPTIONAL { ?packageOccurrence risk:bomRef ?bomRef . }
            OPTIONAL { ?packageOccurrence risk:name ?name . }
            OPTIONAL { ?packageOccurrence risk:group ?group . }
            OPTIONAL { ?packageOccurrence risk:version ?version . }
            OPTIONAL { ?packageOccurrence risk:purl ?purl . }
            OPTIONAL { ?packageOccurrence risk:componentType ?componentType . }
          }
          ORDER BY ?vulnerability ?name ?version ?packageOccurrence
          """;
    }

    private static String packageQuery(String constraint) {
      return PREFIXES
          + """
          SELECT DISTINCT
            ?packageOccurrence ?rdfType ?bomRef ?name ?group ?version ?purl ?componentType
          WHERE {
          """
          + constraint
          + """

            ?application risk:dependsOn+ ?packageOccurrence .
            ?packageOccurrence rdf:type ?rdfType .
            FILTER(?rdfType = risk:PackageOccurrence)
            OPTIONAL { ?packageOccurrence risk:bomRef ?bomRef . }
            OPTIONAL { ?packageOccurrence risk:name ?name . }
            OPTIONAL { ?packageOccurrence risk:group ?group . }
            OPTIONAL { ?packageOccurrence risk:version ?version . }
            OPTIONAL { ?packageOccurrence risk:purl ?purl . }
            OPTIONAL { ?packageOccurrence risk:componentType ?componentType . }
          }
          ORDER BY ?name ?version ?packageOccurrence
          """;
    }

    private PackageOccurrence() {}
  }

  public static final class Vulnerability {
    public static final String GET_ALL = osvQuery("");
    public static final String GET_BY_ID =
        osvQuery(
            "VALUES ?requestedVulnerability { ?vulnerabilityValue } FILTER(?vulnerability = ?requestedVulnerability)");

    public static String getByPackages(int batchSize) {
      return osvQuery(values("packageOccurrence", "packageValue", batchSize));
    }

    public static String getByApplications(int batchSize) {
      return osvQuery(values("application", "applicationValue", batchSize));
    }

    private static String osvQuery(String constraint) {
      return PREFIXES
          + """
          SELECT DISTINCT
            ?application ?packageOccurrence ?vulnerability ?rdfType ?osvId ?alias ?summary ?details
            ?publishedAt ?modifiedAt ?withdrawnAt
            ?fixedPackage ?fixedPackageName ?fixedVersion ?fixedPurl
          WHERE {
            ?application risk:dependsOn+ ?packageOccurrence .
            ?packageOccurrence rdf:type risk:PackageOccurrence ;
                               risk:affectedBy ?vulnerability .
            ?vulnerability rdf:type ?rdfType .
            FILTER(?rdfType = risk:Vulnerability)
          """
          + constraint
          + """

            OPTIONAL { ?vulnerability risk:osvId ?osvId . }
            OPTIONAL { ?vulnerability risk:alias ?alias . }
            OPTIONAL { ?vulnerability risk:summary ?summary . }
            OPTIONAL { ?vulnerability risk:details ?details . }
            OPTIONAL { ?vulnerability risk:publishedAt ?publishedAt . }
            OPTIONAL { ?vulnerability risk:modifiedAt ?modifiedAt . }
            OPTIONAL { ?vulnerability risk:withdrawnAt ?withdrawnAt . }
            OPTIONAL {
              {
                ?vulnerability risk:hasAffectedPackage ?affectedPackage .
                ?affectedPackage risk:hasRange/risk:hasEvent ?fixedPackage .
                ?fixedPackage risk:fixedVersion ?fixedVersion .
                OPTIONAL { ?affectedPackage risk:affectedPackageName ?fixedPackageName . }
                OPTIONAL { ?affectedPackage risk:affectedPackagePurl ?fixedPurl . }
              }
              UNION
              {
                ?vulnerability risk:fixedIn ?fixedPackage .
                ?fixedPackage rdf:type risk:PackageVersion ; risk:version ?fixedVersion .
                OPTIONAL { ?fixedPackage rdfs:label ?fixedPackageName . }
                OPTIONAL { ?fixedPackage risk:purl ?fixedPurl . }
              }
            }
          }
          ORDER BY ?osvId ?alias
          """;
    }

    private Vulnerability() {}
  }

  private static String values(String variable, String parameterPrefix, int batchSize) {
    if (batchSize < 1) {
      throw new IllegalArgumentException("batchSize must be greater than zero");
    }
    StringBuilder values = new StringBuilder("VALUES ?").append(variable).append(" { ");
    for (int index = 0; index < batchSize; index++) {
      values.append('?').append(parameterPrefix).append(index).append(' ');
    }
    return values.append("}\n").toString();
  }
}
