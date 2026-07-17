# Dependency Risk Graph

Dependency Risk Graph is a Spring Boot + React application for ingesting CycloneDX SBOMs, storing them as an RDF knowledge graph, exploring the dependency graph, and querying the graph with SPARQL.

This repository currently contains the first working slice of the product:

- SBOM upload and normalization
- RDF graph generation and persistence with Apache Jena TDB2
- Graph summary and visual dependency exploration in the UI
- SPARQL query formatting and execution
- Dependency path lookup for a package and version
- A dashboard shell with several future pages scaffolded out

## What is implemented so far

### Backend

- Parses CycloneDX JSON SBOM files.
- Normalizes SBOM data into applications, components, and dependency edges.
- Maps SBOM data into an RDF model.
- Persists the latest graph into a local Jena TDB2 dataset at `./data/tdb2`.
- Exposes graph metadata, dependency path lookup, and SPARQL endpoints.
- Supports SPARQL `SELECT` execution only.

### Frontend

- React + TypeScript + Vite app bundled into the Spring Boot build.
- Dashboard with SBOM upload, graph summary cards, Cytoscape dependency graph, and package details panel.
- SPARQL page with editor, formatter, execution, and result table.
- Dependency path page for finding the shortest dependency chain to a package.
- Navigation shell for the rest of the application sections.

### Scaffolded pages

These sections are present in the UI shell but are still placeholders:

- Applications
- Dependencies
- Vulnerabilities
- Security Assistant
- Settings

## Tech Stack

- Java 21
- Spring Boot 4.1
- Apache Jena 6
- JGraphT
- CycloneDX Java parser
- React 19
- TypeScript
- Vite
- Material UI
- Cytoscape.js

## Project Structure

- `src/main/java` - backend services, controllers, graph repository, and SBOM ingestion
- `src/main/resources` - Spring Boot configuration
- `src/main/frontend` - React frontend
- `data/tdb2` - local Jena TDB2 dataset created at runtime

## Build and Run

### Prerequisites

- Java 21
- Maven wrapper (`./mvnw`)
- Internet access on first build so Maven can download backend and frontend dependencies

### Run the application

```bash
./mvnw spring-boot:run
```

This starts the backend on port `8080` and serves the React UI from the same Spring Boot app.

If you want to force the frontend and backend build pipeline before starting the app, use:

```bash
./mvnw clean package generate-resources spring-boot:run
```

On the first run, Maven will also:

- install the required Node.js version through `frontend-maven-plugin`
- run `npm ci` inside `src/main/frontend`
- build the React app
- copy the generated frontend assets into the Spring Boot runtime

If you want to run the frontend separately while developing UI changes:

```bash
cd src/main/frontend
npm ci
npm run dev
```

Then start the backend in another terminal:

```bash
./mvnw spring-boot:run
```

### Build a package

```bash
./mvnw clean package
```

## Runtime Notes

- The application listens on port `8080`.
- Multipart upload size is capped at `20MB`.
- The current SBOM upload flow expects a CycloneDX JSON file.
- Uploaded SBOMs replace the current in-memory graph snapshot and are also written to the local TDB2 store.

## API Endpoints

### SBOM ingestion

- `POST /api/v1/sboms`
  - Upload a CycloneDX JSON SBOM as `multipart/form-data` with a `file` part.
  - Returns the normalized SBOM payload.
- `POST /api/v1/sboms/rdf`
  - Upload the same file format and returns a graph summary after RDF generation.

### Graph metadata

- `GET /api/v1/metadata`
  - Returns the current RDF graph summary and serialized graph payload.

### Dependency path

- `GET /api/dependencies/path?packageName=...&version=...`
  - Returns the shortest dependency path from the application node to the named package.
  - `version` is optional, but can be required when multiple versions share the same package name.

### SPARQL

- `POST /api/v1/sparql/format`
  - Formats a raw SPARQL query.
- `POST /api/v1/sparql/exec`
  - Executes a SPARQL `SELECT` query against the current graph.

## UI Pages

- Dashboard: upload SBOMs, inspect summary counts, and browse the dependency graph
- SPARQL Query: format and execute SPARQL against the current graph
- Dependency Path: inspect a shortest path between the application and a package version
- Applications, Dependencies, Vulnerabilities, Security Assistant, Settings: navigation shells for future work
