# Contributing to Dependency Risk Graph

Thanks for helping improve Dependency Risk Graph. Bug reports, documentation fixes, tests, and focused code contributions are welcome.

## Before you start

- Search existing issues and pull requests to avoid duplicate work.
- Open an issue before making a large architectural or behavioral change.
- Keep changes focused. Unrelated refactoring should be submitted separately.

## Development setup

Requirements:

- JDK 25 or newer
- Internet access for the first build
- Docker only when testing the container workflow

The Maven build installs the configured Node and npm versions, so a separate Node installation is not required for a complete build.

```bash
./mvnw clean verify
```

Run the application with:

```bash
./mvnw spring-boot:run
```

Then open `http://localhost:8080`.

For frontend development with hot reload:

```bash
cd src/main/frontend
npm ci
npm run dev
```

## Testing

Run backend tests:

```bash
./mvnw test
```

Run frontend tests and the production build:

```bash
cd src/main/frontend
npm test
npm run build
```

Add or update tests for behavior changed by your contribution. Before opening a pull request, ensure `./mvnw clean verify` succeeds.

## Project conventions

- Treat RDF as the authoritative data source for Explore and SPARQL features.
- Keep graph writes explicit; read operations must not silently invoke OSV enrichment.
- Scope application reads through persisted dependency relationships.
- When adding an RDF property, update its JSON-LD context, assembler, and tests together.
- Preserve complete advisory evidence and its source identifiers.
- Keep frontend components accessible and responsive.

## Pull requests

Include:

- A concise description of the problem and solution.
- Tests performed and their results.
- Screenshots or recordings for visible UI changes.
- Documentation updates when behavior, configuration, or APIs change.

GitHub Actions must pass before a pull request is merged.

## License

By contributing, you agree that your contribution will be licensed under the [Apache License 2.0](LICENSE).
