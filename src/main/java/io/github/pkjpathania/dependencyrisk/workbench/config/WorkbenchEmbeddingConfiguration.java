package io.github.pkjpathania.dependencyrisk.workbench.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.bgesmallenv15q.BgeSmallEnV15QuantizedEmbeddingModel;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = true)
public class WorkbenchEmbeddingConfiguration {

  @Bean(destroyMethod = "shutdown")
  public ExecutorService embeddingExecutor() {
    return Executors.newFixedThreadPool(
        2, Thread.ofPlatform().name("dependency-graph-embeding-", 0).factory());
  }

  @Bean
  public EmbeddingModel embeddingModel(@Qualifier("embeddingExecutor") Executor embeddingExecutor) {
    return new BgeSmallEnV15QuantizedEmbeddingModel(embeddingExecutor);
  }

  @Bean
  public InMemoryEmbeddingStore<TextSegment> advisoryEmbeddingStore() {
    return new InMemoryEmbeddingStore<>();
  }
}
