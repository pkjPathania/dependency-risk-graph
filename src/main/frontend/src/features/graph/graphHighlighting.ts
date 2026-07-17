import type { DependencyGraphLink, DependencyGraphNode } from './graphTypes';
import type { GraphModel } from './graphMapper';

export function getNodeDegreeById(nodes: DependencyGraphNode[], links: DependencyGraphLink[]): Map<string, number> {
  const degreeByNodeId = new Map<string, number>();

  for (const node of nodes) {
    degreeByNodeId.set(String(node.id), 0);
  }

  for (const link of links) {
    const sourceId = resolveNodeId(link.source);
    const targetId = resolveNodeId(link.target);

    if (sourceId) {
      degreeByNodeId.set(sourceId, (degreeByNodeId.get(sourceId) ?? 0) + 1);
    }

    if (targetId) {
      degreeByNodeId.set(targetId, (degreeByNodeId.get(targetId) ?? 0) + 1);
    }
  }

  return degreeByNodeId;
}

export function getNodeDirectionCounts(
  nodes: DependencyGraphNode[],
  links: DependencyGraphLink[]
): {
  incomingByNodeId: Map<string, number>;
  outgoingByNodeId: Map<string, number>;
} {
  const incomingByNodeId = new Map<string, number>();
  const outgoingByNodeId = new Map<string, number>();

  for (const node of nodes) {
    const nodeId = String(node.id);
    incomingByNodeId.set(nodeId, 0);
    outgoingByNodeId.set(nodeId, 0);
  }

  for (const link of links) {
    const sourceId = resolveNodeId(link.source);
    const targetId = resolveNodeId(link.target);

    if (sourceId) {
      outgoingByNodeId.set(sourceId, (outgoingByNodeId.get(sourceId) ?? 0) + 1);
    }

    if (targetId) {
      incomingByNodeId.set(targetId, (incomingByNodeId.get(targetId) ?? 0) + 1);
    }
  }

  return { incomingByNodeId, outgoingByNodeId };
}

export function getHighlightedState(
  nodes: DependencyGraphNode[],
  links: DependencyGraphLink[],
  selectedNodeId: string | null,
  graph?: GraphModel | null
): {
  highlightedNodeIds: Set<string>;
  highlightedLinkIds: Set<string>;
} {
  const highlightedNodeIds = new Set<string>();
  const highlightedLinkIds = new Set<string>();

  if (!selectedNodeId) {
    return { highlightedNodeIds, highlightedLinkIds };
  }

  highlightedNodeIds.add(selectedNodeId);

  if (graph) {
    let current: string | null | undefined = selectedNodeId;
    while (current) {
      highlightedNodeIds.add(current);
      const parent: string | null = graph.parentByNodeId.get(current) ?? null;
      if (parent) {
        highlightedLinkIds.add(`${parent}__dependsOn__${current}`);
      }
      current = parent;
    }
  }

  for (const link of links) {
    const linkId = getLinkId(link);
    const sourceId = resolveNodeId(link.source);
    const targetId = resolveNodeId(link.target);

    if (sourceId === selectedNodeId || targetId === selectedNodeId) {
      highlightedLinkIds.add(linkId);
      if (sourceId) {
        highlightedNodeIds.add(sourceId);
      }
      if (targetId) {
        highlightedNodeIds.add(targetId);
      }
    }
  }

  for (const node of nodes) {
    if (isSemanticHighlight(node)) {
      highlightedNodeIds.add(String(node.id));
    }
  }

  return { highlightedNodeIds, highlightedLinkIds };
}

export function getPathState(
  graph: GraphModel | null,
  selectedNodeId: string | null
): {
  pathNodeIds: Set<string>;
  pathLinkIds: Set<string>;
} {
  const pathNodeIds = new Set<string>();
  const pathLinkIds = new Set<string>();

  if (!graph || !selectedNodeId) {
    return { pathNodeIds, pathLinkIds };
  }

  let current: string | null = selectedNodeId;
  while (current) {
    pathNodeIds.add(current);
    const parent: string | null = graph.parentByNodeId.get(current) ?? null;
    if (parent) {
      pathLinkIds.add(`${parent}__dependsOn__${current}`);
    }
    current = parent;
  }

  return { pathNodeIds, pathLinkIds };
}

export function hasDirectedCycle(nodes: DependencyGraphNode[], links: DependencyGraphLink[]): boolean {
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(String(node.id), []);
  }

  for (const link of links) {
    const sourceId = resolveNodeId(link.source);
    const targetId = resolveNodeId(link.target);
    if (!sourceId || !targetId) {
      continue;
    }

    const current = adjacency.get(sourceId) ?? [];
    current.push(targetId);
    adjacency.set(sourceId, current);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function visit(nodeId: string): boolean {
    if (inStack.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    inStack.add(nodeId);

    for (const childId of adjacency.get(nodeId) ?? []) {
      if (visit(childId)) {
        return true;
      }
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (visit(String(node.id))) {
      return true;
    }
  }

  return false;
}

export function getLinkId(link: DependencyGraphLink): string {
  return `${resolveNodeId(link.source) ?? 'unknown'}__${link.predicate}__${resolveNodeId(link.target) ?? 'unknown'}`;
}

function resolveNodeId(value: string | DependencyGraphNode | undefined): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value.id === 'string') {
    return value.id;
  }

  return null;
}

function isSemanticHighlight(node: DependencyGraphNode): boolean {
  return node.kind === 'vulnerability' || node.kind === 'fixed-package-version' || node.kind === 'vulnerable-package';
}
