# Dependency-path and OSV reliability implementation note

This note records the model inspection performed before implementation. The project uses one
Jena default graph. Import/application boundaries are RDF relationships inside that graph.

1. **Application root:** today the persisted `risk:rootOccurrence` points to an import-scoped
   component occurrence, but `ComponentMapper` also types that same resource as
   `risk:Application`. The fix separates the canonical `Application` from its persisted
   `ApplicationOccurrence`; the latter is the dependency traversal root.
2. **`risk:dependsOn` subjects:** the importer correctly creates dependency edges between the
   resources registered by CycloneDX bom-ref, which are import-scoped occurrences. After the
   model cleanup, only `ApplicationOccurrence` and `PackageOccurrence` (plus explicitly modeled
   service occurrences) receive dependency edges; canonical package versions do not.
3. **`risk:affectedBy` subject:** canonical `PackageVersion` resources receive this relationship.
   Occurrences do not receive vulnerability relationships.
4. **Occurrence-to-package connection:** today this is `risk:representsPackage`. The target model
   standardizes it as the project-specific `risk:instanceOf` relationship. It is deliberately not
   `rdf:type`: `rdf:type` classifies a resource, while this relationship connects an occurrence to
   a canonical application or package-version resource.
5. **Occurrence-to-import connection:** today this is `risk:inImport`, supplemented by the inverse
   `risk:containsOccurrence`. The target model standardizes the ownership edge as
   `risk:belongsToImport`; occurrence-level queries bind a particular `ImportRun` through it.
6. **Root persistence:** the importer already creates the root occurrence once through
   `RdfResourceIdentityStrategy` and stores `ImportRun risk:rootOccurrence root`. However,
   `SbomImportResult` does not return that IRI, and downstream services do not consistently look it
   up. The fix returns it and makes the persisted relationship authoritative; downstream code does
   not hash or recalculate it.
7. **CVE/path identity mismatch:** `CveImpactService` currently selects an occurrence but invokes
   `DependencyPathService.shortestByIri(applicationIri, occurrenceIri)`. That service reads a
   global projection and requires its target to have `NodeType.PACKAGE_VERSION`. The supplied IRI
   is an occurrence, so lookup fails with `Graph resource not found`. In addition, application
   scope is represented by the root occurrence masquerading as the application and is not bound
   to a selected import. The fix resolves the active/specified `ImportContext`, finds occurrences
   of the affected canonical package version within that import, and performs scoped BFS from the
   persisted root occurrence.

Stale-import policy is **Option A**: every import has unique occurrence resources because occurrence
IRIs include the generated import ID. Canonical `Application` and `PackageVersion` resources remain
global. Re-import creates a new `ImportRun`, preserves earlier imports, and moves the canonical
application's explicit `risk:activeImport` relationship to the new run.
