package io.github.pkjpathania.dependencyrisk.graph.repo;

import lombok.RequiredArgsConstructor;
import org.apache.jena.query.Dataset;
import org.apache.jena.rdf.model.Model;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JenaGraphRepository {
  private final Dataset dataset;

  public void saveAll(Model model) {
    dataset.executeWrite(
        () -> {
          dataset.getDefaultModel().removeAll();
          dataset.getDefaultModel().add(model);
        });
  }

  public Model getModel() {
    return dataset.calculateRead(dataset::getDefaultModel);
  }


}
