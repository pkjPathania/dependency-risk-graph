package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.DependencyGraphSnapshot;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DependencyGraphIndex {
  private final JenaGraphRepository repository;

  private final AtomicReference<DependencyGraphSnapshot> snapshot = new AtomicReference<>();

  public void rebuild() {
    snapshot.updateAndGet(ignored -> repository.build());
  }

  public DependencyGraphSnapshot current() {
    DependencyGraphSnapshot current = snapshot.get();
    if (current != null) {
      return current;
    }
    DependencyGraphSnapshot rebuilt = repository.build();
    if (snapshot.compareAndSet(null, rebuilt)) {
      return rebuilt;
    }
    return snapshot.get();
  }
}
