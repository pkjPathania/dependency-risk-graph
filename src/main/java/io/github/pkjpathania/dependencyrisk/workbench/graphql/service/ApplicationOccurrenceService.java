package io.github.pkjpathania.dependencyrisk.workbench.graphql.service;

import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.util.SparqlUtil;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.mapper.ApplicationOccurrenceMapper;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.ApplicationOccurrence;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.util.QueryUtil;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.apache.jena.query.ParameterizedSparqlString;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ApplicationOccurrenceService {
  private final JenaGraphRepository jenaGraphRepository;

  public List<ApplicationOccurrence> getAll() {
    return jenaGraphRepository.execSelect(
        QueryUtil.ApplicationOccurrence.GET_ALL, ApplicationOccurrenceMapper.map());
  }

  public Optional<ApplicationOccurrence> findById(String applicationId) {
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(QueryUtil.ApplicationOccurrence.GET_BY_ID);
    query.setIri("applicationValue", requireId(applicationId, "applicationId"));
    return jenaGraphRepository.execSelect(query.toString(), ApplicationOccurrenceMapper.map())
        .stream()
        .findFirst();
  }

  public List<ApplicationOccurrence> findByPackage(String packageId) {
    String normalizedId = requireId(packageId, "packageId");
    return findByPackages(List.of(normalizedId)).get(normalizedId);
  }

  public List<ApplicationOccurrence> findByVulnerability(String vulnerabilityId) {
    String normalizedId = requireId(vulnerabilityId, "vulnerabilityId");
    return findByVulnerabilities(List.of(normalizedId)).get(normalizedId);
  }

  public Map<String, List<ApplicationOccurrence>> findByPackages(Collection<String> packageIds) {
    List<String> ids = normalizeIds(packageIds, "packageIds");
    Map<String, List<ApplicationOccurrence>> result = emptyLists(ids);
    if (ids.isEmpty()) {
      return result;
    }
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(QueryUtil.ApplicationOccurrence.getByPackages(ids.size()));
    bindIris(query, "packageValue", ids);
    List<Relationship<ApplicationOccurrence>> rows =
        jenaGraphRepository.execSelect(
            query.toString(),
            solution ->
                new Relationship<>(
                    SparqlUtil.get(solution, "packageOccurrence"),
                    ApplicationOccurrenceMapper.map().apply(solution)));
    for (Relationship<ApplicationOccurrence> row : rows) {
      result.get(row.parentId()).add(row.value());
    }
    return immutableLists(result);
  }

  public Map<String, List<ApplicationOccurrence>> findByVulnerabilities(
      Collection<String> vulnerabilityIds) {
    List<String> ids = normalizeIds(vulnerabilityIds, "vulnerabilityIds");
    Map<String, List<ApplicationOccurrence>> result = emptyLists(ids);
    if (ids.isEmpty()) {
      return result;
    }
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(
            QueryUtil.ApplicationOccurrence.getByVulnerabilities(ids.size()));
    bindIris(query, "vulnerabilityValue", ids);
    List<Relationship<ApplicationOccurrence>> rows =
        jenaGraphRepository.execSelect(
            query.toString(),
            solution ->
                new Relationship<>(
                    SparqlUtil.get(solution, "vulnerability"),
                    ApplicationOccurrenceMapper.map().apply(solution)));
    rows.forEach(row -> result.get(row.parentId()).add(row.value()));
    return immutableLists(result);
  }

  private String requireId(String id, String fieldName) {
    if (id == null || id.isBlank()) {
      throw new IllegalArgumentException(fieldName + " is required");
    }
    return id.trim();
  }

  private List<String> normalizeIds(Collection<String> ids, String fieldName) {
    if (ids == null) {
      throw new IllegalArgumentException(fieldName + " is required");
    }
    LinkedHashSet<String> normalized = new LinkedHashSet<>();
    for (String id : ids) {
      normalized.add(requireId(id, fieldName));
    }
    return List.copyOf(normalized);
  }

  private void bindIris(ParameterizedSparqlString query, String prefix, List<String> ids) {
    for (int index = 0; index < ids.size(); index++) {
      query.setIri(prefix + index, ids.get(index));
    }
  }

  private <T> Map<String, List<T>> emptyLists(List<String> ids) {
    Map<String, List<T>> result = new LinkedHashMap<>();
    ids.forEach(id -> result.put(id, new ArrayList<>()));
    return result;
  }

  private <T> Map<String, List<T>> immutableLists(Map<String, List<T>> values) {
    values.replaceAll((ignored, items) -> List.copyOf(items));
    return values;
  }

  private record Relationship<T>(String parentId, T value) {}
}
