import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { ImpactGraph, ImpactGraphEdge, ImpactGraphNode } from '../../api/types';

export type ImpactGraphMode = 'simplified' | 'detailed';
export type ImpactFlowNodeType = 'application' | 'dependency' | 'vulnerablePackage' | 'vulnerability' | 'fixedVersion';

export type ImpactFlowNodeData = {
  backendNode: ImpactGraphNode;
  label: string;
  version: string | null;
  occurrenceIri?: string;
  occurrenceIris?: string[];
  packageVersionIri?: string;
};

export type ImpactFlowEdgeData = {
  relationship: ImpactGraphEdge['relationship'];
  exposureIds: string[];
};

export type ImpactFlowNode = Node<ImpactFlowNodeData, ImpactFlowNodeType>;
export type ImpactFlowEdge = Edge<ImpactFlowEdgeData, 'semantic'>;

const EDGE_DELIMITER = '\u0000';

export function projectImpactGraph(
  graph: ImpactGraph,
  mode: ImpactGraphMode,
  selectedExposureId: string | null = null
): { nodes: ImpactFlowNode[]; edges: ImpactFlowEdge[] } {
  const scoped = filterImpactGraph(graph, selectedExposureId);
  const projected = mode === 'simplified' ? collapseVulnerablePackages(scoped) : scoped;

  return {
    nodes: projected.nodes.map(toFlowNode),
    edges: projected.edges.map(toFlowEdge)
  };
}

export function filterImpactGraph(graph: ImpactGraph, exposureId: string | null): ImpactGraph {
  if (!exposureId) return graph;

  const edges = graph.edges.filter((edge) =>
    edge.relationship === 'FIXED_IN' || edge.exposureIds.includes(exposureId)
  );
  const visibleNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  graph.nodes.filter((node) => node.nodeType === 'VULNERABILITY').forEach((node) => visibleNodeIds.add(node.id));
  return { nodes: graph.nodes.filter((node) => visibleNodeIds.has(node.id)), edges };
}

export function countDependencyHops(edges: Pick<ImpactGraphEdge, 'relationship'>[]): number {
  return edges.filter((edge) => edge.relationship === 'DEPENDS_ON').length;
}

function collapseVulnerablePackages(graph: ImpactGraph): ImpactGraph {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const collapsedOccurrenceToPackage = new Map<string, string>();

  for (const edge of graph.edges) {
    if (edge.relationship !== 'INSTANCE_OF') continue;
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (source && target?.nodeType === 'VULNERABLE_PACKAGE') {
      collapsedOccurrenceToPackage.set(source.id, target.id);
    }
  }

  if (collapsedOccurrenceToPackage.size === 0) return graph;

  const occurrencesByPackage = new Map<string, string[]>();
  collapsedOccurrenceToPackage.forEach((packageIri, occurrenceIri) => {
    occurrencesByPackage.set(packageIri, [...(occurrencesByPackage.get(packageIri) ?? []), occurrenceIri]);
  });

  const nodes = graph.nodes
    .filter((node) => !collapsedOccurrenceToPackage.has(node.id))
    .map((node) => {
      const occurrenceIris = occurrencesByPackage.get(node.id);
      if (!occurrenceIris) return node;
      return {
        ...node,
        metadata: {
          ...node.metadata,
          occurrenceIri: occurrenceIris[0],
          occurrenceIris,
          packageVersionIri: node.iri
        }
      };
    });

  const edgeByTuple = new Map<string, ImpactGraphEdge>();
  for (const edge of graph.edges) {
    if (edge.relationship === 'INSTANCE_OF' && collapsedOccurrenceToPackage.has(edge.source)) continue;
    const source = collapsedOccurrenceToPackage.get(edge.source) ?? edge.source;
    const target = collapsedOccurrenceToPackage.get(edge.target) ?? edge.target;
    if (source === target) continue;
    const id = edgeId(source, edge.relationship, target);
    const existing = edgeByTuple.get(id);
    edgeByTuple.set(id, {
      ...edge,
      id,
      source,
      target,
      exposureIds: Array.from(new Set([...(existing?.exposureIds ?? []), ...edge.exposureIds]))
    });
  }
  return { nodes, edges: Array.from(edgeByTuple.values()) };
}

function toFlowNode(node: ImpactGraphNode): ImpactFlowNode {
  const occurrenceIris = asStringArray(node.metadata.occurrenceIris);
  return {
    id: node.id,
    type: nodeType(node.nodeType),
    position: { x: 0, y: 0 },
    data: {
      backendNode: node,
      label: node.label ?? node.id,
      version: node.version,
      occurrenceIri: asString(node.metadata.occurrenceIri),
      occurrenceIris: occurrenceIris.length ? occurrenceIris : undefined,
      packageVersionIri: asString(node.metadata.packageVersionIri)
    }
  };
}

function toFlowEdge(edge: ImpactGraphEdge): ImpactFlowEdge {
  const visual = edgeVisual(edge.relationship);
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'semantic',
    label: edge.relationship,
    data: { relationship: edge.relationship, exposureIds: [...edge.exposureIds] },
    markerEnd: { type: MarkerType.ArrowClosed, color: visual.color },
    style: { stroke: visual.color, strokeWidth: visual.width, strokeDasharray: visual.dash },
    labelStyle: { fill: visual.color, fontSize: 10, fontWeight: 800 }
  };
}

function nodeType(type: ImpactGraphNode['nodeType']): ImpactFlowNodeType {
  if (type === 'APPLICATION') return 'application';
  if (type === 'VULNERABLE_PACKAGE') return 'vulnerablePackage';
  if (type === 'VULNERABILITY') return 'vulnerability';
  if (type === 'FIXED_VERSION') return 'fixedVersion';
  return 'dependency';
}

function edgeVisual(relationship: ImpactGraphEdge['relationship']) {
  if (relationship === 'INSTANCE_OF') return { color: '#64748b', width: 1.8, dash: '7 5' };
  if (relationship === 'AFFECTED_BY') return { color: '#d32f2f', width: 2.6, dash: undefined };
  if (relationship === 'FIXED_IN') return { color: '#2e7d32', width: 2.6, dash: undefined };
  return { color: '#2563eb', width: 2, dash: undefined };
}

function edgeId(source: string, relationship: ImpactGraphEdge['relationship'], target: string): string {
  return `${source}${EDGE_DELIMITER}${relationship}${EDGE_DELIMITER}${target}`;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
