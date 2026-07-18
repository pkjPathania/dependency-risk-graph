import { describe, expect, it } from 'vitest';
import type { ImpactGraph } from '../../api/types';
import { layoutImpactGraph } from './cveImpactElkLayout';
import { countDependencyHops, projectImpactGraph } from './cveImpactFlowModel';

describe('CVE impact React Flow model', () => {
  it('uses backend IRIs as node IDs and preserves every semantic edge in detailed mode', () => {
    const projected = projectImpactGraph(responseGraph, 'detailed');

    expect(projected.nodes.map((node) => node.id)).toEqual(responseGraph.nodes.map((node) => node.id));
    expect(projected.edges.map((edge) => [edge.source, edge.data?.relationship, edge.target])).toEqual(
      responseGraph.edges.map((edge) => [edge.source, edge.relationship, edge.target])
    );
    expect(projected.edges.filter((edge) => edge.data?.relationship === 'INSTANCE_OF')).toHaveLength(2);
    expect(projected.edges.some((edge) =>
      edge.source === occurrenceOne && edge.target === packageVersion && edge.data?.relationship === 'DEPENDS_ON'
    )).toBe(false);
    expect(projected.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: packageVersion, target: vulnerability, label: 'AFFECTED_BY' }),
      expect.objectContaining({ source: vulnerability, target: fixedVersion, label: 'FIXED_IN' })
    ]));
  });

  it('collapses terminal occurrences without mutating the backend graph', () => {
    const original = structuredClone(responseGraph);
    const projected = projectImpactGraph(responseGraph, 'simplified');
    const collapsed = projected.nodes.find((node) => node.id === packageVersion);

    expect(projected.nodes.some((node) => node.id === occurrenceOne || node.id === occurrenceTwo)).toBe(false);
    expect(collapsed?.data.packageVersionIri).toBe(packageVersion);
    expect(collapsed?.data.occurrenceIris).toEqual([occurrenceOne, occurrenceTwo]);
    expect(projected.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: dependencyOne, target: packageVersion, label: 'DEPENDS_ON' }),
      expect.objectContaining({ source: dependencyTwo, target: packageVersion, label: 'DEPENDS_ON' }),
      expect.objectContaining({ source: packageVersion, target: vulnerability, label: 'AFFECTED_BY' }),
      expect.objectContaining({ source: vulnerability, target: fixedVersion, label: 'FIXED_IN' })
    ]));
    expect(projected.edges.some((edge) => edge.data?.relationship === 'INSTANCE_OF')).toBe(false);
    expect(responseGraph).toEqual(original);
  });

  it('filters application paths by exposure metadata and retains shared advisory edges', () => {
    const projected = projectImpactGraph(responseGraph, 'detailed', 'exposure-one');

    expect(projected.nodes.some((node) => node.id === applicationTwo)).toBe(false);
    expect(projected.edges.some((edge) =>
      edge.data?.exposureIds.length === 1 && edge.data.exposureIds[0] === 'exposure-two'
    )).toBe(false);
    expect(projected.edges.some((edge) => edge.data?.relationship === 'FIXED_IN')).toBe(true);
  });

  it('counts dependency hops from DEPENDS_ON edges only', () => {
    expect(countDependencyHops(responseGraph.edges)).toBe(4);
  });

  it('assigns readable initial positions with ELK while retaining semantic edges', async () => {
    const projected = projectImpactGraph(responseGraph, 'detailed');
    const layout = await layoutImpactGraph(projected.nodes, projected.edges);

    expect(layout.nodes).toHaveLength(projected.nodes.length);
    expect(layout.nodes.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.position.y))).toBe(true);
    expect(new Set(layout.nodes.map((node) => `${node.position.x}:${node.position.y}`)).size).toBeGreaterThan(1);
    expect(layout.edges.map((edge) => edge.data?.relationship)).toEqual(projected.edges.map((edge) => edge.data?.relationship));
  });
});

const applicationOne = 'urn:test:application-occurrence:one';
const applicationTwo = 'urn:test:application-occurrence:two';
const dependencyOne = 'urn:test:occurrence:dependency-one';
const dependencyTwo = 'urn:test:occurrence:dependency-two';
const occurrenceOne = 'urn:test:occurrence:vulnerable-one';
const occurrenceTwo = 'urn:test:occurrence:vulnerable-two';
const packageVersion = 'urn:test:package:f886';
const vulnerability = 'urn:test:vulnerability:CVE-2026-1000';
const fixedVersion = 'urn:test:package-version:f90a';

const responseGraph: ImpactGraph = {
  nodes: [
    node(applicationOne, 'Orders', 'APPLICATION'),
    node(applicationTwo, 'Analytics', 'APPLICATION'),
    node(dependencyOne, 'web', 'DEPENDENCY'),
    node(dependencyTwo, 'worker', 'DEPENDENCY'),
    node(occurrenceOne, 'jackson occurrence', 'DEPENDENCY'),
    node(occurrenceTwo, 'jackson occurrence', 'DEPENDENCY'),
    node(packageVersion, 'jackson-databind', 'VULNERABLE_PACKAGE'),
    node(vulnerability, 'CVE-2026-1000', 'VULNERABILITY'),
    node(fixedVersion, 'jackson-databind', 'FIXED_VERSION')
  ],
  edges: [
    edge(applicationOne, 'DEPENDS_ON', dependencyOne, ['exposure-one']),
    edge(dependencyOne, 'DEPENDS_ON', occurrenceOne, ['exposure-one']),
    edge(occurrenceOne, 'INSTANCE_OF', packageVersion, ['exposure-one']),
    edge(applicationTwo, 'DEPENDS_ON', dependencyTwo, ['exposure-two']),
    edge(dependencyTwo, 'DEPENDS_ON', occurrenceTwo, ['exposure-two']),
    edge(occurrenceTwo, 'INSTANCE_OF', packageVersion, ['exposure-two']),
    edge(packageVersion, 'AFFECTED_BY', vulnerability, ['exposure-one', 'exposure-two']),
    edge(vulnerability, 'FIXED_IN', fixedVersion, [])
  ]
};

function node(id: string, label: string, nodeType: ImpactGraph['nodes'][number]['nodeType']): ImpactGraph['nodes'][number] {
  return { id, iri: id, label, version: null, nodeType, metadata: {} };
}

function edge(
  source: string,
  relationship: ImpactGraph['edges'][number]['relationship'],
  target: string,
  exposureIds: string[]
): ImpactGraph['edges'][number] {
  return { id: `${source}\u0000${relationship}\u0000${target}`, source, relationship, target, exposureIds };
}
