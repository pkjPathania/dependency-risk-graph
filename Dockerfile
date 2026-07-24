FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY pom.xml ./
RUN mvn --batch-mode --no-transfer-progress dependency:go-offline

COPY src ./src
RUN mkdir -p /private/tmp/dependency-risk-graph-frontend/generated-resources/frontend \
    && mvn --batch-mode --no-transfer-progress -DskipTests clean package


FROM eclipse-temurin:21-jre AS runtime

LABEL org.opencontainers.image.title="Dependency Risk Graph"
LABEL org.opencontainers.image.source="https://github.com/pkjPathania/dependency-risk-graph"

WORKDIR /app

RUN groupadd --system --gid 10001 dependency-risk \
    && useradd --system --uid 10001 --gid dependency-risk --home-dir /app dependency-risk \
    && mkdir -p /app/data \
    && chown -R dependency-risk:dependency-risk /app

COPY --from=build --chown=dependency-risk:dependency-risk \
  /workspace/target/dependency-risk-graph-0.0.1-SNAPSHOT.jar \
  /app/dependency-risk-graph.jar

ENV DEBUG=false \
    DEPENDENCY_RISK_GRAPH_DB_PATH=/app/data/tdb2 \
    DEPENDENCY_RISK_OSV_OUTPUT_DIRECTORY=/app/data/osv

VOLUME ["/app/data"]
EXPOSE 8080

USER dependency-risk

ENTRYPOINT ["java", "-jar", "/app/dependency-risk-graph.jar"]
