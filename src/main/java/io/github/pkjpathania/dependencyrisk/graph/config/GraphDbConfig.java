package io.github.pkjpathania.dependencyrisk.graph.config;

import org.apache.jena.query.Dataset;
import org.apache.jena.tdb2.TDB2Factory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GraphDbConfig {
  @Bean(destroyMethod = "close")
  public Dataset dataset() {
    return TDB2Factory.connectDataset("./data/tdb2");
  }
}
