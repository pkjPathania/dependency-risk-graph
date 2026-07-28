package io.github.pkjpathania.dependencyrisk.workbench.graphql.service;

import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import io.github.pkjpathania.dependencyrisk.graph.util.SparqlUtil;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.mapper.PackageOccurrenceMapper;
import io.github.pkjpathania.dependencyrisk.workbench.graphql.models.PackageOccurrence;
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
public class PackageOccurrenceService {
  private final JenaGraphRepository jenaGraphRepository;

  public List<PackageOccurrence> getAll() {
    return jenaGraphRepository.execSelect(
        QueryUtil.PackageOccurrence.GET_ALL, PackageOccurrenceMapper.map());
  }

  public Optional<PackageOccurrence> findById(String packageId) {
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(QueryUtil.PackageOccurrence.GET_BY_ID);
    query.setIri("packageValue", requireId(packageId, "packageId"));
    return jenaGraphRepository.execSelect(query.toString(), PackageOccurrenceMapper.map()).stream()
        .findFirst();
  }

  public List<PackageOccurrence> findByApplication(String applicationId) {
    String normalizedId = requireId(applicationId, "applicationId");
    return findByApplications(List.of(normalizedId)).get(normalizedId);
  }

  public Map<String, List<PackageOccurrence>> findByApplications(
      Collection<String> applicationIds) {
    List<String> ids = normalizeIds(applicationIds, "applicationIds");
    Map<String, List<PackageOccurrence>> result = emptyLists(ids);
    if (ids.isEmpty()) {
      return result;
    }
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(QueryUtil.PackageOccurrence.getByApplications(ids.size()));
    bindIris(query, "applicationValue", ids);
    List<Relationship<PackageOccurrence>> rows =
        jenaGraphRepository.execSelect(
            query.toString(),
            solution ->
                new Relationship<>(
                    SparqlUtil.get(solution, "application"),
                    PackageOccurrenceMapper.map().apply(solution)));
    for (Relationship<PackageOccurrence> row : rows) {
      result.get(row.parentId()).add(row.value());
    }
    return immutableLists(result);
  }

  public List<PackageOccurrence> findByVulnerability(String vulnerabilityId) {
    String normalizedId = requireId(vulnerabilityId, "vulnerabilityId");
    return findByVulnerabilities(List.of(normalizedId)).get(normalizedId);
  }

  public Map<String, List<PackageOccurrence>> findByVulnerabilities(
      Collection<String> vulnerabilityIds) {
    List<String> ids = normalizeIds(vulnerabilityIds, "vulnerabilityIds");
    Map<String, List<PackageOccurrence>> result = emptyLists(ids);
    if (ids.isEmpty()) {
      return result;
    }
    ParameterizedSparqlString query =
        new ParameterizedSparqlString(
            QueryUtil.PackageOccurrence.getByVulnerabilities(ids.size()));
    bindIris(query, "vulnerabilityValue", ids);
    List<Relationship<PackageOccurrence>> rows =
        jenaGraphRepository.execSelect(
            query.toString(),
            solution ->
                new Relationship<>(
                    SparqlUtil.get(solution, "vulnerability"),
                    PackageOccurrenceMapper.map().apply(solution)));
    for (Relationship<PackageOccurrence> row : rows) {
      result.get(row.parentId()).add(row.value());
    }
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
