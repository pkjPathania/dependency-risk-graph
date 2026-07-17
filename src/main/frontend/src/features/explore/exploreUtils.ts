import type { ApplicationOverview, DependencySummary, GraphMetadata } from '../../api/types';
import type { ExploreWorkspace } from './exploreTypes';

interface JsonLdGraphEntry {
  '@id': string;
  '@type'?: string | string[];
  'rdfs:label'?: string;
  'drg:version'?: string;
  'drg:purl'?: string;
  'drg:dependsOn'?: JsonLdDependency | JsonLdDependency[];
  [key: string]: unknown;
}

interface JsonLdDependency {
  '@id'?: string;
}

interface GraphTraversalResult {
  rootId: string;
  depthById: Map<string, number>;
  reachableIds: Set<string>;
  edgeIds: Set<string>;
  childRefsBySource: Map<string, string[]>;
}

export function deriveApplicationWorkspace(
  metadata: GraphMetadata,
  applicationIri: string
): ExploreWorkspace {
  const entries = normalizeGraphEntries(metadata);
  const root = entries.find((entry) => entry['@id'] === applicationIri);

  if (!root) {
    throw new Error(`Application not found: ${applicationIri}`);
  }

  const entriesById = new Map(entries.map((entry) => [entry['@id'], entry]));
  const traversal = traverseApplicationGraph(root['@id'], entries);
  const dependencyRows = buildDependencyRows(entriesById, traversal);
  const overview = buildApplicationOverview(entriesById, traversal);

  return {
    overview,
    dependencies: dependencyRows
  };
}

function buildApplicationOverview(
  entriesById: Map<string, JsonLdGraphEntry>,
  traversal: GraphTraversalResult
): ApplicationOverview {
  const rootEntry = entriesById.get(traversal.rootId);
  const directDependencyCount = traversal.childRefsBySource.get(traversal.rootId)?.length ?? 0;
  const uniquePackageCount = countReachablePackages(entriesById, traversal);
  const transitiveDependencyCount = Math.max(uniquePackageCount - directDependencyCount, 0);

  return {
    directDependencyCount,
    transitiveDependencyCount,
    uniquePackageCount,
    graphNodeCount: traversal.reachableIds.size,
    graphEdgeCount: traversal.edgeIds.size,
    vulnerablePackageCount: null,
    criticalVulnerabilityCount: null,
    lastEnrichedAt: readLiteral(rootEntry, 'drg:lastEnrichedAt') ?? null
  };
}

function buildDependencyRows(
  entriesById: Map<string, JsonLdGraphEntry>,
  traversal: GraphTraversalResult
): DependencySummary[] {
  const incomingCounts = buildIncomingCounts(traversal.childRefsBySource);

  return Array.from(traversal.reachableIds)
    .filter((iri) => iri !== traversal.rootId)
    .map((iri) => {
      const entry = entriesById.get(iri);
      const childRefs = traversal.childRefsBySource.get(iri) ?? [];
      const type = readType(entry);
      const name = readLabel(entry) ?? iri;
      const version = readLiteral(entry, 'drg:version') ?? null;
      const purl = readLiteral(entry, 'drg:purl') ?? null;
      const depth = traversal.depthById.get(iri) ?? null;

      return {
        iri,
        name,
        version,
        purl,
        direct: depth === 1,
        depth,
        outgoingDependencyCount: childRefs.length,
        incomingDependencyCount: incomingCounts.get(iri) ?? 0,
        vulnerabilityCount: type === 'drg:PackageVersion' ? null : null,
        highestSeverity: null
      };
    })
    .sort((left, right) => {
      const leftDepth = left.depth ?? Number.MAX_SAFE_INTEGER;
      const rightDepth = right.depth ?? Number.MAX_SAFE_INTEGER;
      if (leftDepth !== rightDepth) {
        return leftDepth - rightDepth;
      }

      return left.name.localeCompare(right.name);
    });
}

function buildIncomingCounts(childRefsBySource: Map<string, string[]>): Map<string, number> {
  const counts = new Map<string, number>();

  for (const targetRefs of childRefsBySource.values()) {
    for (const targetRef of targetRefs) {
      counts.set(targetRef, (counts.get(targetRef) ?? 0) + 1);
    }
  }

  return counts;
}

function countReachablePackages(
  entriesById: Map<string, JsonLdGraphEntry>,
  traversal: GraphTraversalResult
): number {
  let count = 0;

  for (const iri of traversal.reachableIds) {
    if (iri === traversal.rootId) {
      continue;
    }

    if (readType(entriesById.get(iri)) === 'drg:PackageVersion') {
      count += 1;
    }
  }

  return count;
}

function traverseApplicationGraph(rootId: string, entries: JsonLdGraphEntry[]): GraphTraversalResult {
  const childRefsBySource = buildChildRefsBySource(entries);
  const depthById = new Map<string, number>([[rootId, 0]]);
  const reachableIds = new Set<string>([rootId]);
  const edgeIds = new Set<string>();
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const currentDepth = depthById.get(current) ?? 0;
    const childRefs = childRefsBySource.get(current) ?? [];

    for (const childRef of childRefs) {
      edgeIds.add(`${current}__dependsOn__${childRef}`);

      const nextDepth = currentDepth + 1;
      const previousDepth = depthById.get(childRef);
      if (typeof previousDepth !== 'number' || nextDepth < previousDepth) {
        depthById.set(childRef, nextDepth);
        reachableIds.add(childRef);
        queue.push(childRef);
      }
    }
  }

  return {
    rootId,
    depthById,
    reachableIds,
    edgeIds,
    childRefsBySource
  };
}

function buildChildRefsBySource(entries: JsonLdGraphEntry[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const entry of entries) {
    const current = map.get(entry['@id']) ?? [];
    for (const targetRef of extractDependencyRefs(entry['drg:dependsOn'])) {
      if (!current.includes(targetRef)) {
        current.push(targetRef);
      }
    }
    map.set(entry['@id'], current);
  }

  return map;
}

function extractDependencyRefs(value: JsonLdDependency | JsonLdDependency[] | undefined): string[] {
  if (!value) {
    return [];
  }

  const dependencies = Array.isArray(value) ? value : [value];
  return dependencies.map((dependency) => dependency['@id']).filter((ref): ref is string => typeof ref === 'string');
}

function normalizeGraphEntries(metadata: GraphMetadata): JsonLdGraphEntry[] {
  const graph = metadata.graph['@graph'];
  if (!Array.isArray(graph)) {
    return [];
  }

  return graph.filter(isJsonLdGraphEntry);
}

function isJsonLdGraphEntry(value: Record<string, unknown>): value is JsonLdGraphEntry {
  return typeof value['@id'] === 'string';
}

function readType(entry: JsonLdGraphEntry | undefined): string | null {
  if (!entry) {
    return null;
  }

  const type = entry['@type'];
  if (typeof type === 'string') {
    return type;
  }

  if (Array.isArray(type)) {
    return type.find((candidate): candidate is string => typeof candidate === 'string') ?? null;
  }

  return null;
}

function readLabel(entry: JsonLdGraphEntry | undefined): string | null {
  const label = readLiteral(entry, 'rdfs:label');
  return label?.trim() ? label.trim() : null;
}

function readLiteral(entry: JsonLdGraphEntry | undefined, key: string): string | null {
  if (!entry) {
    return null;
  }

  const value = entry[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
