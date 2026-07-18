package io.github.pkjpathania.dependencyrisk.graph.service;

import io.github.pkjpathania.dependencyrisk.graph.model.DependencyPathResult;
import io.github.pkjpathania.dependencyrisk.graph.model.ImportContext;

/** Resolves explicit occurrence paths inside one ImportRun in the default graph. */
public interface DependencyPathResolver {
  DependencyPathResult resolve(ImportContext importContext, String targetPackageVersionIri);
}
