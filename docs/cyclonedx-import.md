# CycloneDX import

The importer uses CycloneDX Core Java 12.2.0. `DefaultCycloneDxBomReader` reads only
`bomFormat` and `specVersion` as a lightweight header, validates the document against its
declared CycloneDX JSON schema, and then returns the official
`org.cyclonedx.model.Bom`. The current version policy accepts CycloneDX JSON 1.2 through
1.6. A future version is rejected instead of being parsed as the newest known schema.

## Identity and dependency semantics

`metadata.component` is registered first and is the canonical root even when it is absent
from `components[]`. Exact, unmodified `bom-ref` values are used for all joins within the
BOM. PURLs are normalized separately and are used for canonical package-version identity,
OSV lookup, and portfolio-wide matching. A bom-ref is never assumed to equal a PURL.

The default RDF graph uses two resource layers:

- `risk:ComponentOccurrence` is scoped by `importId + bom-ref` and belongs to one
  `risk:SbomImport` through `risk:inImport`.
- `risk:PackageVersion` is shared across imports when components have the same normalized,
  versioned PURL. An occurrence links to it with `risk:representsPackage`.

Every explicit CycloneDX dependency is persisted as:

```text
parent occurrence risk:dependsOn child occurrence
```

No dependency is inferred from component order, PURL similarity, Maven group, project
qualifiers, source layout, or a local repository. Transitive dependencies are not flattened.
An empty dependency entry is `DECLARED_LEAF`; an indexed object without an entry is
`DEPENDENCY_INFORMATION_UNKNOWN`.

## Mapping and persistence

Mapping has two phases. The first creates the metadata component, component, service,
vulnerability, and composition resources. The second creates explicit dependency,
vulnerability, composition, and provenance relationships. The mutable mapping context and
diagnostics collector exist only for one import.

The completed in-memory Jena model is added to `dataset.getDefaultModel()` in one write
transaction. No named graph is created. The default graph is the portfolio knowledge graph,
while occurrence identities prevent dependency paths from crossing SBOM imports.

The import policy is **replace current application snapshot**. The canonical root PURL is
the application identity when available; otherwise the exact root bom-ref is used. Saving a
new snapshot removes only the previous import-scoped resources for that identity and adds
the new model in the same transaction. Other imports, shared package versions, and shared
vulnerability resources remain. An import can also be deleted by import ID without clearing
the default graph.

## Graph quality and paths

Diagnostics distinguish usable graphs, module-only graphs, root-only graphs, missing graphs,
unresolved references, and unspecified completeness. Schema validity is not treated as proof
of semantic completeness. Counts include dependency entries and edges, leaves, unknown
dependency information, unresolved or duplicate references, root reachability, and maximum
depth.

Dependency-path resolution is separate from import. It requires an import ID and exact
versioned PURL, finds matching occurrences within that import, and performs cycle-safe BFS
over occurrence-to-occurrence `risk:dependsOn` edges. Returned paths are root-to-target.
Canonical package resources are never traversed as dependency nodes.
