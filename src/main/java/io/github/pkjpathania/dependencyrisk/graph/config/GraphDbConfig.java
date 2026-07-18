package io.github.pkjpathania.dependencyrisk.graph.config;

import org.apache.jena.query.Dataset;
import org.apache.jena.tdb2.TDB2Factory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class GraphDbConfig {
  @Bean(destroyMethod = "close")
  public Dataset dataset(@Value("${dependency-risk.graph-db.path:./data/tdb2}") String datasetPath) {
    return TDB2Factory.connectDataset(datasetPath);
  }
}
