# Dependency Risk Graph

[![Build](https://github.com/pkjPathania/dependency-risk-graph/actions/workflows/build.yml/badge.svg)](https://github.com/pkjPathania/dependency-risk-graph/actions/workflows/build.yml) [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

[Project Website](https://pkjpathania.github.io/dependency-risk-graph/) · [Contributing](CONTRIBUTING.md)

Dependency Risk Graph is a Java-first software supply-chain knowledge graph evolving into a **neuro-symbolic AI platform**. It imports CycloneDX JSON SBOMs, enriches package occurrences with complete OSV advisories, connects both datasets in one knowledge graph, and provides a React interface for application, dependency, vulnerability, reference, CVE-impact, and SPARQL exploration.

The graph remains the source of truth. Deterministic graph traversal and SPARQL provide the symbolic reasoning layer, while embeddings and grounded language models provide the neural layer. Together, they are being developed to produce security answers that are explainable, evidence-backed, and constrained by the software supply-chain graph.

![Dependency Risk Graph](docs/assets/hero.png)

[Explore Page Demo v1 (YouTube)](https://www.youtube.com/watch?v=0JgUOX8NOmY)

## Table of Contents

- [What the Application Does](#what-the-application-does)
- [Neuro-Symbolic AI Direction](#neuro-symbolic-ai-direction)
- [Current Architecture](#current-architecture)
  - [Implemented neuro-symbolic paths](#implemented-neuro-symbolic-paths)
  - [Design principles](#design-principles)
- [End-to-End Data Flow](#end-to-end-data-flow)
  - [CycloneDX ingestion](#1-cyclonedx-ingestion)
  - [Application OSV enrichment](#2-application-osv-enrichment)
  - [Explore and CVE impact](#3-explore-and-cve-impact)
  - [Advisory evidence indexing and retrieval](#4-advisory-evidence-indexing-and-retrieval)
  - [Buggy schema-driven GraphQL execution](#5-buggy-schema-driven-graphql-execution)
- [Knowledge Graph Model](#knowledge-graph-model)
  - [CycloneDX occurrence graph](#cyclonedx-occurrence-graph)
  - [OSV enrichment graph](#osv-enrichment-graph)
- [User Interface](#user-interface)
  - [Overview and ingestion](#overview-and-ingestion)
  - [Application overview](#application-overview)
  - [Dependencies](#dependencies)
  - [Vulnerabilities and advisory detail](#vulnerabilities-and-advisory-detail)
  - [References](#references)
  - [CVE impact](#cve-impact)
  - [SPARQL](#sparql)
  - [AI Workbench advisory evidence](#ai-workbench-advisory-evidence)
  - [GraphQL Playground](#graphql-playground)
- [API Reference](#api-reference)
- [Quick Start](#quick-start)
- [SPARQL Examples](#sparql-examples)
- [Configuration](#configuration)
- [Development](#development)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [TODO / Next Steps](#todo--next-steps)
- [Current Limitations](#current-limitations)
- [License](#license)

## What the Application Does

- Accepts a CycloneDX JSON SBOM as multipart form data at `POST /rdf/new`.
- Preserves CycloneDX component `bom-ref` values as stable graph identities.
- Stores application and package occurrences plus declared `risk:dependsOn` edges.
- Finds application dependencies from the persisted occurrence graph.
- Queries OSV in batches and loads the complete advisory for every returned OSV ID.
- Converts OSV responses into normalized graph data and adds them to the shared knowledge graph.
- Links each scanned package occurrence to vulnerabilities with `risk:affectedBy`.
- Stores advisory aliases, details, timestamps, references, severity vectors, affected packages, version ranges, and range events.
- Provides an application-level enrichment API and a read-only single-PURL lookup API.
- Exposes application-centric Explore tabs for overview, dependencies, vulnerabilities, references, and CVE impact.
- Provides unrestricted read-only SPARQL `SELECT` execution through the UI/API.
- Exposes application occurrences through Spring GraphQL and a built-in GraphiQL Playground.
- Renders a responsive, CVE-centered impact-and-fixes tree with D3 and SVG.
- Rebuilds an in-memory advisory evidence index from the knowledge graph and exposes global semantic evidence search in AI Workbench.
- Runs Buggy as a schema-driven assistant that generates and executes read-only GraphQL before answering.

## Neuro-Symbolic AI Direction

Dependency Risk Graph is moving beyond standalone GraphRAG toward a neuro-symbolic architecture:

- **Symbolic layer:** stable identities, typed relationships, SPARQL, dependency-path traversal, CVE impact analysis, and deterministic remediation context.
- **Neural layer:** semantic evidence retrieval, local embeddings, natural-language interaction, and grounded answer generation.
- **Integration layer:** graph-resolved context and ranked evidence are combined so generated answers can be traced back to dependency paths, advisories, fixes, and source records.

The goal is not to replace graph reasoning with a language model. The model should interpret and communicate facts established by the knowledge graph, expose the evidence behind its conclusions, and state when the graph does not contain enough information.

## Current Architecture

```mermaid
flowchart TB
    subgraph Sources[Supply-chain sources]
        SBOM[CycloneDX JSON SBOM]
        APP[Application IRI]
        OSV[OSV API]
    end

    subgraph Writes[Explicit write pipelines]
        CDX[CycloneDX assemblers]
        CDXGRAPH[CycloneDX graph document]
        PLAN[Application dependency scan plan]
        OSVCLIENT[Batch query and advisory detail loading]
        OSVGRAPH[OSV graph assemblers]
        GRAPHPARSER[Graph document parser]
    end

    SBOM -->|POST /rdf/new| CDX --> CDXGRAPH --> GRAPHPARSER
    APP -->|Enrich| PLAN --> OSVCLIENT
    OSVCLIENT <--> OSV
    OSVCLIENT --> OSVGRAPH --> GRAPHPARSER

    subgraph Symbolic[Symbolic knowledge and reasoning]
        STORE[(Authoritative knowledge graph)]
        EXPLORE[Explore and CVE-impact services]
        SPARQL[Read-only SPARQL service]
        PATH[Dependency-path and graph projections]
        GQLSERVICE[Occurrence GraphQL services]
    end

    GRAPHPARSER --> STORE
    STORE --> EXPLORE
    STORE --> SPARQL
    STORE --> PATH
    STORE --> GQLSERVICE

    subgraph Neural[Neural retrieval and generation]
        EVIDENCE[Advisory evidence projection]
        CHUNKS[Typed evidence chunks]
        BGE[Quantized BGE-small-en-v1.5 embeddings]
        VECTOR[(In-memory embedding store)]
        EVIDENCEANSWER[Evidence-grounded answer service]
        BUGGY[Schema-driven Buggy GraphQL assistant]
        CHAT[OpenAI-compatible chat model / Groq]
    end

    STORE --> EVIDENCE --> CHUNKS --> BGE --> VECTOR
    VECTOR --> EVIDENCEANSWER --> CHAT
    BUGGY -->|Generated read-only query| GQLSERVICE
    BUGGY <--> CHAT

    subgraph Interfaces[Application interfaces]
        REST[Spring MVC APIs]
        GRAPHQL[Spring GraphQL /graphql]
        UI[React + Material UI]
        PLAYGROUND[Built-in GraphiQL Playground]
        TREE[D3/SVG CVE impact tree]
    end

    EXPLORE --> REST
    SPARQL --> REST
    PATH --> REST
    EVIDENCEANSWER --> REST
    BUGGY --> REST
    GQLSERVICE --> GRAPHQL
    REST <--> UI
    GRAPHQL <--> PLAYGROUND
    UI --> PLAYGROUND
    UI --> TREE
```

### Implemented neuro-symbolic paths

- **Deterministic graph path:** Explore, CVE Impact, dependency projections, SPARQL, and GraphQL read the shared knowledge graph directly.
- **Schema-driven assistant path:** Buggy sends the GraphQL schema and question to the chat model, validates and executes the generated read-only query, and grounds a second model call in the GraphQL result.
- **Evidence-grounded generation path:** advisory graph data is projected into typed chunks, encoded locally with BGE-small-en-v1.5, stored in memory, retrieved by similarity, and supplied to the configured chat model with the matching evidence returned to the UI.
- **Developer query path:** Spring GraphQL exposes applications, packages, vulnerabilities, and their relationships; the AI Workbench Playground embeds GraphiQL for schema discovery and query execution.

The schema-driven assistant and evidence-answer services remain separate grounded workflows.

### Design principles

1. **The knowledge graph is authoritative.** Explore does not maintain a second vulnerability database.
2. **Writes are explicit.** Selecting an application in Explore does not invoke OSV. The user starts enrichment from the Vulnerability Enrichment screen or API.
3. **CycloneDX and OSV retain separate mappings.** Each source is normalized according to its own shape before it is added to the graph.
4. **Occurrences retain source identity.** The new importer uses CycloneDX `bom-ref` values directly rather than mapping them back into a separate canonical package layer.
5. **OSV data stays normalized.** References, severities, affected packages, ranges, and events remain connected to one vulnerability record.
6. **Reads are application-scoped.** Explore begins at an `ApplicationOccurrence` and follows `risk:dependsOn+` to its reachable packages.
7. **Single-PURL lookup is non-persistent.** `/enrich/purl` returns complete OSV DTO responses but does not modify the knowledge graph.
8. **Evidence search is diagnostic and global.** AI Workbench ranks all indexed advisory chunks by semantic similarity; it does not treat a CVE or GHSA mentioned in the query as a retrieval scope.
9. **AI answers have explicit grounding paths.** Buggy answers from executed GraphQL results, while the evidence answer service receives only the advisory chunks returned by semantic retrieval.

## End-to-End Data Flow

### 1. CycloneDX ingestion

```text
MultipartFile
  -> CycloneDX parser
  -> metadata/component/dependency assemblers
  -> normalized graph document
  -> graph model
  -> persistent graph
```

`CycloneDxMetadataAssembler` creates the root `risk:ApplicationOccurrence`. `CycloneDxComponentAssembler` creates supported application and library occurrences. `CycloneDxDependencyAssembler` writes only dependency relationships declared in the SBOM.

The importer does not infer dependencies from Maven coordinates, component order, directory layout, or PURL similarity.

### 2. Application OSV enrichment

```text
Application IRI
  -> ExplorerService.dependencySummary(applicationIri)
  -> versioned PURL scan plan
  -> OSV batch query
  -> distinct advisory detail loading
  -> Enriched(packageIri, complete OSV responses)
  -> normalized advisory graph
  -> graph model
  -> persistent graph
```

The package identifier in `Enriched` is the imported package occurrence IRI. The enrichment pipeline adds `risk:affectedBy` to that resource. It does not translate the result back into a legacy package-version/import-run model.

`GET /api/v1/vulnerabilities/enrich` returns:

```json
{
  "parsed": 1200,
  "added": 1175,
  "total": 86200
}
```

- `parsed`: triples parsed from the generated advisory graph document.
- `added`: triples that were not already present in the dataset.
- `total`: triples in the default graph after the write.

### 3. Explore and CVE impact

Explore reads the combined graph:

```text
ApplicationOccurrence
    │
    └── risk:dependsOn
            ▼
     PackageOccurrence
            │
            ├── risk:dependsOn
            │       ▼
            │  PackageOccurrence
            │
            └── risk:affectedBy
                    ▼
              Vulnerability
```

The CVE Impact detail endpoint resolves the dependency path from the selected application occurrence to each affected package occurrence, appends the vulnerability, and returns exposures, fixes, CVSS assessments, references, and a graph projection. Shared nodes and edges are deduplicated while exposure IDs preserve which application/package path each edge belongs to.

The frontend transforms that projection into a responsive D3/SVG tidy tree. The selected CVE is centered, impacted applications and dependency paths extend to the left, and provided fixes extend to the right. Node identities are merged consistently so the same dependency is not rendered repeatedly for equivalent paths.

Persisted CVSS vectors are parsed into version-specific CVSS objects before they are returned. Each assessment includes its vector, implementation name, calculated severity, base/impact/exploitability scores, and the metrics available for that CVSS version.

### 4. Advisory evidence indexing and retrieval

AI Workbench builds retrieval evidence from advisory data already stored in the knowledge graph:

```text
Vulnerability graph records
  -> advisory source projection
  -> overview / technical details / impact / remediation / severity / upstream-fix chunks
  -> BGE-small-en-v1.5 quantized embeddings
  -> LangChain4j InMemoryEmbeddingStore
  -> global semantic similarity search
  -> ranked Evidence cards
```

`POST /api/workbench/evidence/rebuild` finds all advisory identifiers in the graph, regenerates their typed evidence documents, embeds them, and replaces the complete in-memory evidence store. Embeddings are prepared before the write lock is taken, so existing searches can continue until the brief store replacement.

`POST /api/workbench/assistant/evidence` embeds the natural-language question and searches across every indexed evidence chunk. `maxResults` controls the result limit and `minScore` applies the similarity threshold. The retrieved chunks are supplied to Buggy's configured chat model, and the response contains the question, generated answer summary, evidence matches, final-snitch metadata, and model identity.

This screen intentionally performs **global semantic discovery**. A query that names a CVE can return related advisories when their chunks are semantically similar. The UI shows Buggy's summary after the match count and marks an exact CVE or GHSA only when that identifier actually occurs in the returned vulnerability ID or evidence text. Identifier-scoped graph resolution is not part of this workflow.

### 5. Buggy schema-driven GraphQL execution

The main Buggy assistant uses the GraphQL schema and graph-backed resolvers rather than the evidence-answer pipeline:

```text
User question
  -> GET /api/workbench/buggy/ask
  -> GraphQL schema plus question sent to the configured chat model
  -> generated query validated as one read-only operation
  -> Spring GraphQL execution
  -> batched authoritative SPARQL against the persistent graph
  -> GraphQL result plus question sent to the chat model
  -> grounded natural-language response
```

Generated `id` arguments are accepted only for complete RDF IRIs explicitly present in the user's question. Human-readable names use plural collection fields so the final answer can select the matching entity from authoritative graph results.

## Knowledge Graph Model

The vocabulary namespace is:

```text
urn:io-github-pkjpathania:dependency-risk-graph:schema:
```

### CycloneDX occurrence graph

```mermaid
flowchart LR
    A[ApplicationOccurrence] -->|risk:dependsOn| B[PackageOccurrence]
    B -->|risk:dependsOn| C[PackageOccurrence]
    A -->|risk:name/version/purl/bomRef| AM[Scalar metadata]
    B -->|risk:name/version/purl/bomRef| BM[Scalar metadata]
```

Core classes and properties:

- `risk:ApplicationOccurrence`
- `risk:PackageOccurrence`
- `risk:dependsOn`
- `risk:name`
- `risk:group`
- `risk:version`
- `risk:purl`
- `risk:bomRef`
- `risk:componentType`

### OSV enrichment graph

```mermaid
flowchart LR
    P[Imported package occurrence] -->|risk:affectedBy| V[Vulnerability]
    V -->|risk:hasReference| R[VulnerabilityReference]
    V -->|risk:hasSeverity| S[SeverityAssessment]
    V -->|risk:hasAffectedPackage| AP[AffectedPackage]
    AP -->|risk:hasRange| VR[VersionRange]
    VR -->|risk:hasEvent| E[RangeEvent]
```

Important OSV properties:

- Vulnerability: `risk:osvId`, `risk:alias`, `risk:summary`, `risk:details`, `risk:publishedAt`, `risk:modifiedAt`, `risk:withdrawnAt`
- References: `risk:hasReference`, `risk:referenceType`, `risk:referenceUrl`
- Severity: `risk:hasSeverity`, `risk:severityType`, `risk:severityScore`
- Affected packages: `risk:hasAffectedPackage`, `risk:affectedPackageName`, `risk:affectedPackagePurl`, `risk:ecosystem`, `risk:affectedVersion`
- Ranges: `risk:hasRange`, `risk:rangeType`, `risk:repositoryUrl`
- Events: `risk:hasEvent`, `risk:introducedVersion`, `risk:fixedVersion`, `risk:lastAffectedVersion`, `risk:limitVersion`

Resource IRIs for vulnerabilities and their child resources are deterministic, allowing repeated enrichment to add only previously unseen triples.

## User Interface

The frontend is a React 19 single-page application bundled into the Spring Boot JAR. Navigation is managed by the application shell rather than a client-side URL router.

### Overview and ingestion

Upload one CycloneDX JSON file, inspect live graph totals, and open an imported application in Explore.

![Overview and CycloneDX ingestion](docs/assets/overview.png)

### Application overview

The Overview tab summarizes direct and transitive dependencies, graph size, vulnerable packages, and vulnerability metrics for the selected application.

![Explore application overview](docs/assets/explore-overview.png)

### Dependencies

Dependencies are read by following `risk:dependsOn+` from the selected application. Direct dependencies are distinguished from transitive dependencies.

![Explore dependencies](docs/assets/explore-dependencies.png)

### Vulnerabilities and advisory detail

The Vulnerabilities tab joins imported occurrences to OSV resources. It displays the installed package, dependency type, advisory identity, severity data, CVSS vector type, fixed range events, publication time, complete advisory content, and reference links.

![Explore vulnerabilities](docs/assets/explore-vluns.png)

![Vulnerability advisory details](docs/assets/expore-vlun-detail.png)

### References

References are stored as dedicated graph records. The UI groups them by advisory and displays affected installed packages.

![Explore vulnerability references](docs/assets/explore-vluns-ref.png)

### CVE impact

The initial CVE Impact view groups one vulnerability across selected or all applications.

![Cross-application CVE impact list](docs/assets/cve-impact.png)

Selecting an advisory opens a focused CVE-centered tidy tree. Impacted applications and their dependency paths are placed to the left of the CVE, while provided fixes are placed to the right. The responsive SVG scales the complete graph to the available width and compacts circular node glyphs as the graph grows.

![CVE impact dependency graph](docs/assets/explore-cve-impacted-applications.png)

Selecting a graph node opens a compact anchored popover with that node's name, version, PURL, and application context. Selecting **View path** highlights the corresponding exposure with an animated dotted path. Small **Details**, **CVSS Vector**, and **References** actions open focused dialogs above the graph, while the exposure table remains available below it.

![CVE impact graph and advisory detail panel](docs/assets/explore-cve-jetty-all-direct.png)

### SPARQL

The SPARQL screen provides prefix presets, example queries, formatting, `SELECT` execution, results, and clipboard export.

![SPARQL query editor](docs/assets/sparql.png)

### AI Workbench advisory evidence

The Evidence screen combines Buggy's generated summary with retrieval inspection. It can rebuild the advisory vector index, submit natural-language questions, configure the result limit and minimum score, and inspect the exact chunks used to ground the summary.

Each result displays its global rank, evidence segment type, vulnerability and document identifiers, similarity score, and complete source text. Long chunks expand independently, and the copy action always copies the complete evidence. An exact-identifier marker distinguishes literal CVE/GHSA matches from merely related semantic results.

![AI Workbench advisory evidence](docs/assets/workbench-Evidence.png)

### GraphQL Playground

AI Workbench includes a full-size GraphiQL interface backed by `POST /graphql`. The current schema exposes `applicationOccurrences` and its graph-derived scalar fields. GraphiQL performs schema introspection, query completion, documentation browsing, execution, history, and response inspection directly inside the application UI.

## API Reference

### Primary new flow

| Method | Path | Purpose | Response |
| --- | --- | --- | --- |
| `POST` | `/rdf/new` | Import and persist a multipart CycloneDX JSON file (`file`). | `GraphMetadata` |
| `GET` | `/api/v1/vulnerabilities/enrich?applicationIri=...` | Batch-query OSV, load complete advisories, assemble normalized graph data, and persist it. | `OsvStoreResult` |
| `GET` | `/api/v1/vulnerabilities/enrich/purl?purl=...` | Return complete OSV advisory DTOs for one PURL without modifying the graph. | `PurlEnrichment` |

### Graph and Explore APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/metadata` | Return graph counts and the structured representation of the current graph. |
| `GET` | `/api/v1/explore/applications` | List imported applications. |
| `GET` | `/api/v1/explore/overview?applicationIri=...` | Return application graph metrics. |
| `GET` | `/api/v1/explore/dependencies?applicationIri=...` | List reachable dependency occurrences. |
| `GET` | `/api/v1/explore/vulnerabilities?applicationIri=...` | Return package-level vulnerability rows. |
| `GET` | `/api/v1/explore/references?applicationIri=...` | Return references grouped by advisory. |
| `GET` | `/api/v1/explore/cve-impact?scope=selected&applicationIri=...` | Group vulnerabilities for one application. |
| `GET` | `/api/v1/explore/cve-impact?scope=all` | Group vulnerabilities across all applications. |
| `GET` | `/api/v1/explore/cve-impact/detail?vulnerabilityIri=...&scope=...` | Return advisory details, exposures, remediation data, and the focused impact graph. |

### SPARQL and supporting APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/sparql/format` | Format a plain-text SPARQL query. |
| `POST` | `/api/v1/sparql/exec` | Execute a SPARQL `SELECT` query. |
| `GET` | `/api/v1/sparql/summaries` | List application summaries. |
| `POST` | `/api/osv` | Pass one package query directly to OSV without graph persistence. |
| `POST` | `/api/v1/vulnerabilities/scan` | Compatibility scan pipeline returning the structured scan response. |
| `GET` | `/api/dependencies/path?importId=...&targetPackageVersionIri=...` | Resolve a path for the older import-scoped graph model. |

### AI Workbench Evidence APIs

| Method | Path | Purpose | Response |
| --- | --- | --- | --- |
| `GET` | `/api/workbench/evidence/source/{identifier}` | Load the graph-backed advisory evidence source for one identifier. | `AdvisoryEvidenceSource` |
| `POST` | `/api/workbench/evidence/index/{identifier}` | Generate and index evidence documents for one identifier. | `AdvisoryEvidenceDocument[]` |
| `POST` | `/api/workbench/evidence/search` | Search the current in-memory evidence index without generating an assistant answer. | `AdvisoryEvidenceMatch[]` |
| `POST` | `/api/workbench/evidence/rebuild` | Regenerate typed advisory documents and replace the complete in-memory vector index. | `AdvisoryEvidenceDocument[]` |
| `POST` | `/api/workbench/assistant/evidence` | Retrieve global semantic evidence and generate Buggy's grounded summary. | `BuggyAnswerResponse` |

### Buggy Agent and GraphQL APIs

| Method | Path | Purpose | Response |
| --- | --- | --- | --- |
| `GET` | `/api/workbench/buggy/ask?question=...` | Generate, validate, and execute read-only GraphQL, then answer from its result. | Grounded answer text |
| `POST` | `/graphql` | Execute GraphQL queries against the graph-backed application occurrence service. | GraphQL response |

## Quick Start

### Requirements

- JDK 25 or newer
- Internet access during the first Maven build and for live OSV enrichment
- No separate Node installation is required for the Maven build; the frontend plugin installs the configured Node version
- Docker, when using the container workflow

### Build

```bash
./mvnw clean package
```

The Maven lifecycle installs frontend dependencies, creates the Vite production bundle, copies it into the application resources, compiles Java, runs tests, and builds the executable JAR.

### Run

```bash
java -jar target/dependency-risk-graph-0.0.1-SNAPSHOT.jar
```

Or:

```bash
./mvnw spring-boot:run
```

Open `http://localhost:8080`.

### Docker

Build the image and run the application with the provided script:

```bash
./run.sh
```

The container publishes the application at `http://localhost:8080` and stores knowledge-graph and OSV data in the `dependency-risk-data` Docker volume.

The equivalent commands are:

```bash
docker build -t dependency-risk-graph .
docker run --rm \
  --name dependency-risk-graph \
  -p 8080:8080 \
  -v dependency-risk-data:/app/data \
  dependency-risk-graph
```

Set `PORT` when the default host port is already in use:

```bash
PORT=9090 ./run.sh
```

### Import an SBOM

```bash
curl -sS -X POST http://localhost:8080/rdf/new \
  -F 'file=@/path/to/application.cdx.json'
```

The default multipart limit is 20 MB.

### Enrich an application

Use the application IRI returned by the application list or SPARQL query:

```bash
curl -sS -G http://localhost:8080/api/v1/vulnerabilities/enrich \
  --data-urlencode 'applicationIri=pkg:maven/org.example/application@1.0.0'
```

### Find complete advisories for one PURL

```bash
curl -sS -G http://localhost:8080/api/v1/vulnerabilities/enrich/purl \
  --data-urlencode 'purl=pkg:maven/org.apache.commons/commons-lang3@3.18.0'
```

This endpoint returns the PURL and complete OSV advisory responses. It does not modify the knowledge graph.

### Rebuild and search advisory evidence

Rebuild the in-memory index after advisory data has been added or updated:

```bash
curl -sS -X POST http://localhost:8080/api/workbench/evidence/rebuild
```

Then run a global semantic search:

```bash
curl -sS -X POST http://localhost:8080/api/workbench/assistant/evidence \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "Which versions fix CVE-2026-54515?",
    "maxResults": 5,
    "minScore": 0.55
  }'
```

The evidence index is process-local and is not stored permanently. Rebuild it after an application restart before searching.

## SPARQL Examples

### Applications

```sparql
PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

SELECT ?application ?name ?version ?purl
WHERE {
  ?application a risk:ApplicationOccurrence .
  OPTIONAL { ?application risk:name ?name . }
  OPTIONAL { ?application risk:version ?version . }
  OPTIONAL { ?application risk:purl ?purl . }
}
ORDER BY LCASE(STR(?name))
```

### Dependencies for one application

```sparql
PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

SELECT DISTINCT ?package ?name ?version ?purl ?direct
WHERE {
  VALUES ?application { <APPLICATION_IRI> }
  ?application risk:dependsOn+ ?package .
  OPTIONAL { ?package risk:name ?name . }
  OPTIONAL { ?package risk:version ?version . }
  OPTIONAL { ?package risk:purl ?purl . }
  BIND(EXISTS { ?application risk:dependsOn ?package } AS ?direct)
}
ORDER BY DESC(?direct) LCASE(STR(?name))
```

### Enriched vulnerabilities and references

```sparql
PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

SELECT ?packageName ?packageVersion ?osvId ?alias ?referenceUrl
WHERE {
  VALUES ?application { <APPLICATION_IRI> }
  ?application risk:dependsOn+ ?package .
  ?package risk:name ?packageName ;
           risk:affectedBy ?vulnerability .
  OPTIONAL { ?package risk:version ?packageVersion . }
  ?vulnerability a risk:Vulnerability ; risk:osvId ?osvId .
  OPTIONAL { ?vulnerability risk:alias ?alias . }
  OPTIONAL {
    ?vulnerability risk:hasReference/risk:referenceUrl ?referenceUrl .
  }
}
ORDER BY LCASE(STR(?packageName)) LCASE(STR(?osvId))
```

### Severity vectors and fixed range events

```sparql
PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

SELECT ?osvId ?severityType ?severityScore ?fixedVersion
WHERE {
  ?vulnerability a risk:Vulnerability ; risk:osvId ?osvId .
  OPTIONAL {
    ?vulnerability risk:hasSeverity ?severity .
    ?severity risk:severityType ?severityType ;
              risk:severityScore ?severityScore .
  }
  OPTIONAL {
    ?vulnerability risk:hasAffectedPackage/risk:hasRange/risk:hasEvent ?event .
    ?event risk:fixedVersion ?fixedVersion .
  }
}
ORDER BY LCASE(STR(?osvId)) STR(?fixedVersion)
```

## Configuration

Primary settings are in `src/main/resources/application.yaml`:

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 20MB

dependency-risk:
  osv:
    enabled: true
    batch-size: 50
    advisory-fetch-threads: 8
    output-directory: src/main/resources/osv
    max-attempts: 3
    connect-timeout: 10s
    read-timeout: 45s
```

The knowledge-graph data directory can be configured with:

```yaml
dependency-risk:
  graph-db:
    path: /path/to/graph-data
```

The same configuration file contains source-to-graph mappings for CycloneDX and OSV. When adding a new graph property, update the relevant mapping and assembler together.

## Development

### Frontend with hot reload

```bash
cd src/main/frontend
npm ci
npm run dev
```

Vite runs on `http://localhost:5173` and proxies API requests to the Spring Boot server on port 8080.

### Tests

```bash
./mvnw test
```

```bash
cd src/main/frontend
npm test
```

```bash
cd src/main/frontend
npm run build
```

## Technology Stack

- Java 25
- Spring Boot 4.1
- Knowledge-graph persistence and SPARQL query processing
- CycloneDX Core Java 12.2
- CVSS Calculator 1.5
- React 19 and TypeScript
- Material UI
- D3 7 with responsive SVG rendering
- Spring GraphQL with a built-in GraphiQL 5 Playground
- LangChain4j with the quantized BGE-small-en-v1.5 embedding model
- LangChain4j `InMemoryEmbeddingStore` for advisory evidence
- Schema-driven GraphQL query generation for Buggy
- OpenAI-compatible chat integration configured for Groq
- Vite
- OSV REST APIs through Spring `RestClient`

## Project Structure

```text
src/main/java/io/github/pkjpathania/dependencyrisk/
  graph/
    controller/             ingestion, Explore, SPARQL, and path APIs
    parser/assembler/       CycloneDX graph assembly
    repo/                   knowledge-graph persistence and projection
    serialization/          native CVSS JSON serialization
    service/                Explore, CVE impact, SPARQL, and graph services
    util/                   CVSS parsing and shared graph utilities
  vulnerability/
    assembler/              OSV graph assembly
    client/                 OSV request/response client
    service/                batching, advisory loading, and enrichment
  workbench/
    api/                    advisory evidence rebuild and search endpoints
    assistant/              GraphQL-driven Buggy and evidence-grounded answer services
    config/                 chat model, embeddings, and in-memory store
    evidence/               graph projection, chunking, indexing, and search
    graphql/                Spring GraphQL queries, services, models, and graph mapping

src/main/frontend/src/
  pages/                    top-level application screens
  pages/workbench/          Buggy, Evidence, GraphiQL, analysis, and trace views
  components/workbench/     Workbench shell and Evidence result components
  api/workbenchEvidence.ts  typed Evidence HTTP integration
  features/explore/         Explore tabs and CVE impact graph
  features/sparql/          SPARQL presets and helpers

docs/                       static project website
  assets/                   shared website and README screenshots
cyclonedx-import.md         CycloneDX import implementation notes
dependency-path-osv-reliability-implementation-note.md
                            dependency-path and OSV reliability notes
data/                       local knowledge-graph data
```

## TODO / Next Steps

- [ ] Complete and validate deterministic dependency-path discovery and visualization.
- [ ] **In progress — Neuro-symbolic AI:** combine GraphQL-grounded answers and evidence retrieval into one inspectable workflow.

## Current Limitations

- Only CycloneDX JSON is accepted by the new ingestion endpoint.
- Ingestion and enrichment add triples to the default graph; they do not remove an older application snapshot or stale vulnerability links.
- Only dependencies with usable PURLs can be sent to OSV.
- Malformed or unsupported CVSS vectors cannot be projected into calculated scores and metrics.
- SPARQL execution accepts `SELECT` queries only.
- Graph data is stored locally and is not provided as a distributed service.
- The import-scoped dependency-path endpoint belongs to the older graph model and is not populated by `POST /rdf/new`.
- The UI uses in-memory page navigation rather than routable browser URLs.
- Authentication and authorization are not implemented.
- Advisory evidence retrieval is global semantic discovery, not CVE/GHSA-scoped retrieval through the knowledge graph.
- The advisory embedding store is in memory and must be rebuilt after each application restart.
- Buggy's generated queries are limited to the relationships exposed by the GraphQL schema.
- The GraphQL-grounded and evidence-grounded answer services are separate flows, and conversation memory is not persisted.

## License

Copyright 2026 Pankaj Pathania.

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
