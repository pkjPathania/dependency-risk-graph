package io.github.pkjpathania.dependencyrisk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class DependencyRiskGraphApplication {

  public static void main(String[] args) {
    SpringApplication.run(DependencyRiskGraphApplication.class, args);
  }
}
