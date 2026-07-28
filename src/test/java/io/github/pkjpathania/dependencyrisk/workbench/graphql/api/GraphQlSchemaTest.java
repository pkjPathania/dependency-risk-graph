package io.github.pkjpathania.dependencyrisk.workbench.graphql.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mockingDetails;

import graphql.ExecutionResult;
import io.github.pkjpathania.dependencyrisk.DependencyRiskGraphApplication;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.vocabulary.RiskVocabulary;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.RDF;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.ExecutionGraphQlService;
import org.springframework.graphql.support.DefaultExecutionGraphQlRequest;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

@SpringBootTest(
    classes = DependencyRiskGraphApplication.class,
    properties = "dependency-risk.graph-db.path=target/test-data/graphql-schema")
class GraphQlSchemaTest {
  private static final String APPLICATION = "urn:test:graphql:application";
  private static final String PACKAGE = "urn:test:graphql:package";
  private static final String VULNERABILITY = "urn:test:graphql:vulnerability";
  private static final String FIXED_PACKAGE = "urn:test:graphql:package:fixed:2.0";

  @Autowired private ExecutionGraphQlService graphQlService;
  @MockitoSpyBean private JenaGraphRepository repository;

  @Test
  void executesTheApplicationPackageVulnerabilityOsvTraversal() {
    populateGraph();

    ExecutionResult result =
        graphQlService
            .execute(
                new DefaultExecutionGraphQlRequest(
                    """
                query {
                  applicationOccurrence(id: "urn:test:graphql:application") {
                    id
                    packages {
                      id
                      applications { id }
                      vulnerabilities {
                        id
                        packages { id }
                        fixedVersions { id packageName version purl }
                        osv {
                          osvId
                          aliases
                          summary
                          details
                          publishedAt
                          modifiedAt
                          withdrawnAt
                        }
                      }
                    }
                  }
                }
                """,
                    null,
                    Map.of(),
                    Map.of(),
                    "batch-mapping-test",
                    Locale.ROOT))
            .block()
            .getExecutionResult();

    assertTrue(result.getErrors().isEmpty(), () -> result.getErrors().toString());
    Map<String, Object> data = result.getData();
    Map<?, ?> application = (Map<?, ?>) data.get("applicationOccurrence");
    assertEquals(APPLICATION, application.get("id"));

    Map<?, ?> packageOccurrence = first(application, "packages");
    assertEquals(PACKAGE, packageOccurrence.get("id"));
    assertEquals(APPLICATION, first(packageOccurrence, "applications").get("id"));

    Map<?, ?> vulnerability = first(packageOccurrence, "vulnerabilities");
    assertEquals(VULNERABILITY, vulnerability.get("id"));
    assertEquals(PACKAGE, first(vulnerability, "packages").get("id"));
    Map<?, ?> fixedVersion = first(vulnerability, "fixedVersions");
    assertEquals(FIXED_PACKAGE, fixedVersion.get("id"));
    assertEquals("2.0", fixedVersion.get("version"));
    Map<?, ?> osv = (Map<?, ?>) vulnerability.get("osv");
    assertEquals("GHSA-GRAPHQL", osv.get("osvId"));
    assertEquals(List.of("CVE-2026-100", "GHSA-ALIAS"), osv.get("aliases"));
    assertEquals("GraphQL traversal advisory", osv.get("summary"));
  }

  @Test
  void batchesEveryNestedRelationshipAcrossAllParents() {
    populateGraph();
    clearInvocations(repository);

    ExecutionResult result =
        execute(
            """
            query {
              applicationOccurrences {
                id
                packages {
                  id
                  applications { id }
                  vulnerabilities { id }
                }
              }
            }
            """);

    assertTrue(result.getErrors().isEmpty(), () -> result.getErrors().toString());
    long selectCount =
        mockingDetails(repository).getInvocations().stream()
            .filter(invocation -> invocation.getMethod().getName().equals("execSelect"))
            .count();
    assertEquals(4, selectCount);
  }

  private ExecutionResult execute(String document) {
    return graphQlService
        .execute(
            new DefaultExecutionGraphQlRequest(
                document, null, Map.of(), Map.of(), "batch-mapping-test", Locale.ROOT))
        .block()
        .getExecutionResult();
  }

  private Map<?, ?> first(Map<?, ?> parent, String field) {
    return (Map<?, ?>) ((List<?>) parent.get(field)).getFirst();
  }

  private void populateGraph() {
    repository.write(
        model -> {
          Resource application =
              model
                  .createResource(APPLICATION)
                  .addProperty(RDF.type, RiskVocabulary.APPLICATION_OCCURRENCE)
                  .addProperty(RiskVocabulary.NAME, "GraphQL application");
          Resource packageOccurrence =
              model
                  .createResource(PACKAGE)
                  .addProperty(RDF.type, RiskVocabulary.PACKAGE_OCCURRENCE)
                  .addProperty(RiskVocabulary.NAME, "graphql-package");
          Resource vulnerability =
              model
                  .createResource(VULNERABILITY)
                  .addProperty(RDF.type, RiskVocabulary.VULNERABILITY)
                  .addProperty(RiskVocabulary.OSV_ID, "GHSA-GRAPHQL")
                  .addProperty(RiskVocabulary.ALIAS, "CVE-2026-100")
                  .addProperty(RiskVocabulary.ALIAS, "GHSA-ALIAS")
                  .addProperty(RiskVocabulary.SUMMARY, "GraphQL traversal advisory");
          Resource fixedPackage =
              model
                  .createResource(FIXED_PACKAGE)
                  .addProperty(RDF.type, RiskVocabulary.PACKAGE_VERSION)
                  .addProperty(RiskVocabulary.VERSION, "2.0")
                  .addProperty(RiskVocabulary.PURL, "pkg:maven/example/graphql-package@2.0");
          application.addProperty(RiskVocabulary.DEPENDS_ON, packageOccurrence);
          packageOccurrence.addProperty(RiskVocabulary.AFFECTED_BY, vulnerability);
          vulnerability.addProperty(RiskVocabulary.FIXED_IN, fixedPackage);
        });
  }
}
