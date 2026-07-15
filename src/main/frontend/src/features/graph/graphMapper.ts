import type { DependencyEdge, NormalizedSbom, PackageComponent } from '../../api/types';

export interface GraphNodeData {
  bomRef: string;
  name: string;
  version: string | null;
  purl: string | null;
  type: string | null;
  isApplication: boolean;
  depth: number;
  childCount: number;
  visibleChildCount: number;
  hasHiddenChildren: boolean;
  searchText: string;
}

export interface GraphEdgeData {
  predicate: 'dependsOn';
  label: 'dependsOn';
}

export interface GraphModel {
  rootId: string;
  nodesById: Map<string, GraphNodeData>;
  edgesById: Map<string, GraphEdgeData>;
  visibleNodeIds: Set<string>;
  childRefsBySource: Map<string, string[]>;
  depthByNodeId: Map<string, number>;
}

interface GraphTraversalOptions {
  expandedNodeIds?: ReadonlySet<string>;
  maxInitialDepth?: number;
}

export function mapNormalizedSbomToGraph(
  sbom: NormalizedSbom,
  options: GraphTraversalOptions = {}
): GraphModel {
  const maxInitialDepth = options.maxInitialDepth ?? 2;
  const expandedNodeIds = options.expandedNodeIds ?? new Set<string>();
  const componentsByRef = new Map(sbom.components.map((component) => [component.bomRef, component]));
  const childRefsBySource = buildChildRefsBySource(sbom.dependencies);
  const rootId = findApplicationRef(sbom, componentsByRef, sbom.dependencies);
  const visibleNodeIds = new Set<string>();
  const depthByNodeId = new Map<string, number>();
  const edgesById = new Map<string, GraphEdgeData>();
  const nodesById = new Map<string, GraphNodeData>();
  const queue: Array<{ ref: string; depth: number }> = [{ ref: rootId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const { ref, depth } = current;
    const knownDepth = depthByNodeId.get(ref);
    if (typeof knownDepth === 'number' && knownDepth <= depth) {
      continue;
    }

    depthByNodeId.set(ref, depth);
    visibleNodeIds.add(ref);

    const childRefs = childRefsBySource.get(ref) ?? [];
    const shouldTraverseChildren = depth < maxInitialDepth || expandedNodeIds.has(ref);

    for (const childRef of childRefs) {
      const edgeId = `${ref}__dependsOn__${childRef}`;
      if (!edgesById.has(edgeId)) {
        edgesById.set(edgeId, {
          predicate: 'dependsOn',
          label: 'dependsOn'
        });
      }

      const nextDepth = depth + 1;
      const existingDepth = depthByNodeId.get(childRef);
      if (shouldTraverseChildren && (typeof existingDepth !== 'number' || nextDepth < existingDepth)) {
        queue.push({ ref: childRef, depth: nextDepth });
      }
    }
  }

  for (const ref of visibleNodeIds) {
    const depth = depthByNodeId.get(ref) ?? 0;
    const component = ref === rootId ? fallbackRootComponent(sbom, rootId, componentsByRef) : componentsByRef.get(ref);
    const childRefs = childRefsBySource.get(ref) ?? [];
    const visibleChildCount = childRefs.filter((childRef) => visibleNodeIds.has(childRef)).length;

    nodesById.set(ref, buildGraphNodeData({
      ref,
      component,
      depth,
      isApplication: ref === rootId,
      childCount: childRefs.length,
      visibleChildCount
    }));
  }

  return {
    rootId,
    nodesById,
    edgesById,
    visibleNodeIds,
    childRefsBySource,
    depthByNodeId
  };
}

export function getGraphElements(
  graph: GraphModel,
  selectedNodeId: string | null,
  searchTerm: string
): Array<Record<string, unknown>> {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const elements: Array<Record<string, unknown>> = [];

  for (const [nodeId, node] of graph.nodesById.entries()) {
    const classes = [
      node.isApplication ? 'application-node' : 'package-node',
      selectedNodeId === nodeId ? 'selected-node' : '',
      normalizedSearch && node.searchText.includes(normalizedSearch) ? 'search-hit' : ''
    ]
      .filter(Boolean)
      .join(' ');

    elements.push({
      data: {
        id: nodeId,
        ...node
      },
      classes
    });
  }

  for (const [edgeId, edge] of graph.edgesById.entries()) {
    const [source, target] = edgeId.split('__dependsOn__');
    if (!graph.visibleNodeIds.has(source) || !graph.visibleNodeIds.has(target)) {
      continue;
    }

    elements.push({
      data: {
        id: edgeId,
        source,
        target,
        ...edge
      },
      classes: 'dependency-edge'
    });
  }

  return elements;
}

function buildChildRefsBySource(dependencies: DependencyEdge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const dependency of dependencies) {
    const current = map.get(dependency.sourceRef) ?? [];
    for (const targetRef of dependency.targetRefs) {
      if (!current.includes(targetRef)) {
        current.push(targetRef);
      }
    }
    map.set(dependency.sourceRef, current);
  }

  return map;
}

function findApplicationRef(
  sbom: NormalizedSbom,
  componentsByRef: Map<string, PackageComponent>,
  dependencies: DependencyEdge[]
): string {
  const componentRefs = new Set(componentsByRef.keys());
  const candidate = dependencies.find((dependency) => !componentRefs.has(dependency.sourceRef))?.sourceRef;
  return candidate ?? `application:${sbom.applicationName}`;
}

function fallbackRootComponent(
  sbom: NormalizedSbom,
  rootId: string,
  componentsByRef: Map<string, PackageComponent>
): PackageComponent {
  return (
    componentsByRef.get(rootId) ?? {
      bomRef: rootId,
      group: null,
      name: sbom.applicationName || 'application',
      version: sbom.applicationVersion,
      purl: null,
      type: 'application'
    }
  );
}

function buildGraphNodeData(input: {
  ref: string;
  component: PackageComponent | undefined;
  depth: number;
  isApplication: boolean;
  childCount: number;
  visibleChildCount: number;
}): GraphNodeData {
  const name = input.component?.name?.trim() || input.ref;
  const version = input.component?.version ?? null;
  const purl = input.component?.purl ?? null;
  const type = input.component?.type ?? null;

  return {
    bomRef: input.ref,
    name,
    version,
    purl,
    type,
    isApplication: input.isApplication,
    depth: input.depth,
    childCount: input.childCount,
    visibleChildCount: input.visibleChildCount,
    hasHiddenChildren: input.childCount > input.visibleChildCount,
    searchText: `${name} ${version ?? ''} ${purl ?? ''} ${input.ref}`.toLowerCase()
  };
}
