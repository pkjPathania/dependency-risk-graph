import ForceGraph3D, {
  type ForceGraph3DInstance,
  type LinkObject,
  type NodeObject
} from '3d-force-graph';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { type Theme, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { escapePercent } from '../../api/sbomApi';
import type { GraphModel, GraphNodeData } from './graphMapper';
import {
  getHighlightedState,
  getLinkId,
  getNodeDegreeById,
  getNodeDirectionCounts,
  hasDirectedCycle,
  getPathState
} from './graphHighlighting';
import { getGraphScale, getGraphVisualConfig, getLabelTextHeight, getNodeValue } from './graphScaling';
import {
  getGraphBorderColor,
  getLabelBackground,
  getSemanticLinkColor,
  getSemanticNodeColor
} from './graphTheme';
import { DependencyGraphToolbar } from './DependencyGraphToolbar';
import { getNodeGeometry } from './graphGeometry';
import { useElementSize } from './useElementSize';
import type {
  GraphColorMode,
  DependencyGraphLink,
  DependencyGraphNode,
  GraphLayoutMode,
  GraphScale
} from './graphTypes';

interface DependencyGraphProps {
  graph: GraphModel;
  selectedNodeId: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectNode: (nodeId: string | null) => void;
  onToggleExpandNode: (nodeId: string) => void;
}

interface ForceGraphNode extends NodeObject, GraphNodeData, DependencyGraphNode {
  id: string;
}

interface ForceGraphLink extends LinkObject<ForceGraphNode>, DependencyGraphLink {
  source: string;
  target: string;
}

const DAG_MODE_BY_LAYOUT: Record<Exclude<GraphLayoutMode, 'force'>, 'radialout' | 'lr'> = {
  radial: 'radialout',
  flow: 'lr'
};

export function DependencyGraph({
  graph,
  selectedNodeId,
  searchTerm,
  onSearchTermChange,
  onSelectNode,
  onToggleExpandNode
}: DependencyGraphProps) {
  const theme = useTheme();
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const graphShellRef = useRef<HTMLDivElement | null>(null);
  const graphHostRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ForceGraph3DInstance<ForceGraphNode, ForceGraphLink> | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  const onToggleExpandNodeRef = useRef(onToggleExpandNode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<GraphLayoutMode>('force');
  const [colorMode, setColorMode] = useState<GraphColorMode>('semantic');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const graphData = useMemo(() => buildForceGraphData(graph), [graph]);
  const nodeCount = graphData.nodes.length;
  const linkCount = graphData.links.length;
  const scale = useMemo(() => getGraphScale(nodeCount), [nodeCount]);
  const visualConfig = useMemo(() => getGraphVisualConfig(nodeCount, theme), [nodeCount, theme]);
  const graphBackground = theme.palette.background.paper;
  const graphBorderColor = getGraphBorderColor(theme);
  const degreeByNodeId = useMemo(() => getNodeDegreeById(graphData.nodes, graphData.links), [graphData]);
  const { incomingByNodeId, outgoingByNodeId } = useMemo(
    () => getNodeDirectionCounts(graphData.nodes, graphData.links),
    [graphData]
  );
  const { highlightedNodeIds, highlightedLinkIds } = useMemo(
    () => getHighlightedState(graphData.nodes, graphData.links, selectedNodeId, graph),
    [graph, graphData, selectedNodeId]
  );
  const { pathNodeIds, pathLinkIds } = useMemo(
    () => getPathState(graph, selectedNodeId),
    [graph, selectedNodeId]
  );
  const hasCycle = useMemo(() => hasDirectedCycle(graphData.nodes, graphData.links), [graphData]);
  const effectiveLayoutMode: GraphLayoutMode = layoutMode !== 'force' && hasCycle ? 'force' : layoutMode;
  const containerSize = useElementSize(graphShellRef);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  useEffect(() => {
    onToggleExpandNodeRef.current = onToggleExpandNode;
  }, [onToggleExpandNode]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (layoutMode !== 'force' && hasCycle) {
      setWarningMessage('This graph contains a cycle, so Explore layout is being used instead.');
      return;
    }

    setWarningMessage(null);
  }, [hasCycle, layoutMode]);

  useEffect(() => {
    const container = graphHostRef.current;
    if (!container || fgRef.current) {
      return;
    }

    try {
      const graphInstance = new ForceGraph3D(container) as unknown as ForceGraph3DInstance<
        ForceGraphNode,
        ForceGraphLink
      >;

      fgRef.current = graphInstance;
      applyGraphConfiguration({
        graphInstance,
        graphBackground,
        normalizedSearch,
        selectedNodeId,
        colorMode,
        scale,
        visualConfig,
        degreeByNodeId,
        incomingByNodeId,
        outgoingByNodeId,
        highlightedNodeIds,
        highlightedLinkIds,
        pathNodeIds,
        pathLinkIds,
        layoutMode: effectiveLayoutMode,
        nodeCount,
        theme,
        onSelectNodeRef,
        onToggleExpandNodeRef
      });

      const size = container.getBoundingClientRect();
      graphInstance.width(Math.round(size.width));
      graphInstance.height(Math.round(size.height));
      graphInstance.graphData(graphData);
      scheduleFit(graphInstance);

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        graphInstance.width(entry.contentRect.width);
        graphInstance.height(entry.contentRect.height);
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        graphInstance._destructor();
        fgRef.current = null;
      };
    } catch (error) {
      setInitError(error instanceof Error ? error.message : 'Failed to initialize the dependency graph.');
      return undefined;
    }
  }, []);

  useEffect(() => {
    const graphInstance = fgRef.current;
    if (!graphInstance) {
      return;
    }

    applyGraphConfiguration({
      graphInstance,
      graphBackground,
      normalizedSearch,
      selectedNodeId,
      colorMode,
      scale,
      visualConfig,
      degreeByNodeId,
      incomingByNodeId,
      outgoingByNodeId,
      highlightedNodeIds,
      highlightedLinkIds,
      pathNodeIds,
      pathLinkIds,
      layoutMode: effectiveLayoutMode,
      nodeCount,
      theme,
      onSelectNodeRef,
      onToggleExpandNodeRef
    });
    graphInstance.graphData(graphData);
    graphInstance.resumeAnimation();
  }, [
    degreeByNodeId,
    effectiveLayoutMode,
    graphBackground,
    graphBorderColor,
    graphData,
    highlightedLinkIds,
    highlightedNodeIds,
    pathLinkIds,
    pathNodeIds,
    incomingByNodeId,
    normalizedSearch,
    nodeCount,
    outgoingByNodeId,
    scale,
    selectedNodeId,
    colorMode,
    theme,
    visualConfig
  ]);

  useEffect(() => {
    if (!fgRef.current || nodeCount === 0) {
      return;
    }

    scheduleFit(fgRef.current);
  }, [effectiveLayoutMode, nodeCount]);

  async function handleToggleFullscreen() {
    const element = fullscreenRef.current;
    if (!element) {
      return;
    }

    if (document.fullscreenElement === element) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen();
  }

  function handleLayoutChange(_: React.MouseEvent<HTMLElement>, nextLayout: GraphLayoutMode | null) {
    if (!nextLayout) {
      return;
    }

    setLayoutMode(nextLayout);
  }

  function handleColorModeChange(_: React.MouseEvent<HTMLElement>, nextMode: GraphColorMode | null) {
    if (!nextMode) {
      return;
    }

    setColorMode(nextMode);
  }

  function handleFitGraph() {
    fgRef.current?.zoomToFit(650, 40);
  }

  function handleResetSelection() {
    onSelectNode(null);
    fgRef.current?.zoomToFit(450, 40);
  }

  if (initError) {
    return (
      <Alert severity="error" variant="filled" sx={{ whiteSpace: 'pre-wrap' }}>
        {initError}
      </Alert>
    );
  }

  if (nodeCount === 0) {
    return (
      <Stack spacing={2}>
        <Toolbar
          graphBackground={graphBackground}
          graphBorderColor={graphBorderColor}
          graphScale={scale}
          layoutMode={layoutMode}
          colorMode={colorMode}
          linkCount={linkCount}
          nodeCount={nodeCount}
          onSearchTermChange={onSearchTermChange}
          searchTerm={searchTerm}
          onFitGraph={handleFitGraph}
          onFullscreenToggle={() => void handleToggleFullscreen()}
          onLayoutChange={handleLayoutChange}
          onColorModeChange={handleColorModeChange}
          onResetSelection={handleResetSelection}
          isFullscreen={isFullscreen}
        />
        <Alert severity="info" variant="outlined">
          No dependency graph is available for this application.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack
      ref={fullscreenRef}
      spacing={2}
      sx={{
        ...(isFullscreen
          ? {
              p: 2,
              bgcolor: 'background.paper'
            }
          : {})
      }}
    >
      <Toolbar
        graphBackground={graphBackground}
        graphBorderColor={graphBorderColor}
        graphScale={scale}
        layoutMode={layoutMode}
        colorMode={colorMode}
        linkCount={linkCount}
        nodeCount={nodeCount}
        onSearchTermChange={onSearchTermChange}
        searchTerm={searchTerm}
        onFitGraph={handleFitGraph}
        onFullscreenToggle={() => void handleToggleFullscreen()}
        onLayoutChange={handleLayoutChange}
        onColorModeChange={handleColorModeChange}
        onResetSelection={handleResetSelection}
        isFullscreen={isFullscreen}
      />

      {warningMessage ? (
        <Alert severity="warning" variant="outlined" sx={{ whiteSpace: 'pre-wrap' }}>
          {warningMessage}
        </Alert>
      ) : null}

      <Box
        ref={graphShellRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: {
            xs: 520,
            md: 'calc(100vh - 220px)'
          },
          minHeight: 520,
          maxHeight: 900,
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: graphBackground,
          border: '1px solid',
          borderColor: graphBorderColor,
          boxShadow: 'none',
          flexGrow: 1
        }}
      >
        <Box
          ref={graphHostRef}
          sx={{
            position: 'absolute',
            inset: 0
          }}
        />
        {containerSize.width === 0 || containerSize.height === 0 ? (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Preparing graph canvas...
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Stack>
  );
}

function Toolbar({
  graphBackground,
  graphBorderColor,
  graphScale,
  layoutMode,
  colorMode,
  linkCount,
  nodeCount,
  onSearchTermChange,
  searchTerm,
  onFitGraph,
  onFullscreenToggle,
  onLayoutChange,
  onColorModeChange,
  onResetSelection,
  isFullscreen
}: {
  graphBackground: string;
  graphBorderColor: string;
  graphScale: GraphScale;
  layoutMode: GraphLayoutMode;
  colorMode: GraphColorMode;
  linkCount: number;
  nodeCount: number;
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
  onFitGraph: () => void;
  onFullscreenToggle: () => void;
  onLayoutChange: (event: React.MouseEvent<HTMLElement>, nextLayout: GraphLayoutMode | null) => void;
  onColorModeChange: (event: React.MouseEvent<HTMLElement>, nextMode: GraphColorMode | null) => void;
  onResetSelection: () => void;
  isFullscreen: boolean;
}) {
  return (
    <DependencyGraphToolbar
      graphBackground={graphBackground}
      graphBorderColor={graphBorderColor}
      graphScale={graphScale}
      layoutMode={layoutMode}
      colorMode={colorMode}
      linkCount={linkCount}
      nodeCount={nodeCount}
      onSearchTermChange={onSearchTermChange}
      searchTerm={searchTerm}
      onFitGraph={onFitGraph}
      onFullscreenToggle={onFullscreenToggle}
      onLayoutChange={onLayoutChange}
      onColorModeChange={onColorModeChange}
      onResetSelection={onResetSelection}
      isFullscreen={isFullscreen}
    />
  );
}

function buildForceGraphData(graph: GraphModel): { nodes: ForceGraphNode[]; links: ForceGraphLink[] } {
  const nodes: ForceGraphNode[] = [];
  const links: ForceGraphLink[] = [];
  const incomingByNodeId = new Map<string, number>();

  for (const [edgeId] of graph.edgesById.entries()) {
    const [source, target] = edgeId.split('__dependsOn__');
    if (!graph.visibleNodeIds.has(source) || !graph.visibleNodeIds.has(target)) {
      continue;
    }

    incomingByNodeId.set(target, (incomingByNodeId.get(target) ?? 0) + 1);
  }

  for (const [nodeId, node] of graph.nodesById.entries()) {
    const kind = resolveNodeKind(node);
    const degree = (incomingByNodeId.get(nodeId) ?? 0) + (graph.childRefsBySource.get(nodeId)?.length ?? 0);
    nodes.push({
      ...node,
      id: nodeId,
      label: formatNodeLabel(node),
      kind,
      val: resolveNodeValue(node, degree),
      color: '',
      opacity: 1
    });
  }

  for (const [edgeId] of graph.edgesById.entries()) {
    const [source, target] = edgeId.split('__dependsOn__');
    if (!graph.visibleNodeIds.has(source) || !graph.visibleNodeIds.has(target)) {
      continue;
    }

    links.push({
      id: edgeId,
      source,
      target,
      predicate: 'DEPENDS_ON',
      color: '',
      opacity: 1
    });
  }

  return { nodes, links };
}

function applyGraphConfiguration({
  graphInstance,
  graphBackground,
  normalizedSearch,
  selectedNodeId,
  colorMode,
  scale,
  visualConfig,
  degreeByNodeId,
  incomingByNodeId,
  outgoingByNodeId,
  highlightedNodeIds,
  highlightedLinkIds,
  pathNodeIds,
  pathLinkIds,
  layoutMode,
  nodeCount,
  theme,
  onSelectNodeRef,
  onToggleExpandNodeRef
}: {
  graphInstance: ForceGraph3DInstance<ForceGraphNode, ForceGraphLink>;
  graphBackground: string;
  normalizedSearch: string;
  selectedNodeId: string | null;
  colorMode: GraphColorMode;
  scale: GraphScale;
  visualConfig: ReturnType<typeof getGraphVisualConfig>;
  degreeByNodeId: Map<string, number>;
  incomingByNodeId: Map<string, number>;
  outgoingByNodeId: Map<string, number>;
  highlightedNodeIds: Set<string>;
  highlightedLinkIds: Set<string>;
  pathNodeIds: Set<string>;
  pathLinkIds: Set<string>;
  layoutMode: GraphLayoutMode;
  nodeCount: number;
  theme: Theme;
  onSelectNodeRef: React.MutableRefObject<(nodeId: string | null) => void>;
  onToggleExpandNodeRef: React.MutableRefObject<(nodeId: string) => void>;
}) {
  const instance = graphInstance as any;
  const nodeMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

  function getNodeMaterial(
    node: ForceGraphNode,
    isHighlighted: boolean,
    isDimmed: boolean
  ): THREE.MeshStandardMaterial {
    const key = [
      node.kind,
      colorMode,
      isHighlighted ? 'highlight' : 'base',
      isDimmed ? 'dim' : 'full'
    ].join('|');

    const existing = nodeMaterialCache.get(key);
    if (existing) {
      return existing;
    }

    const opacity = resolveNodeOpacity(node, isHighlighted, isDimmed, visualConfig);
    const color = getSemanticNodeColor(node, theme, scale, colorMode, isHighlighted, isDimmed);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      transparent: opacity < 1,
      opacity,
      roughness: 0.55,
      metalness: 0.1,
      emissive: new THREE.Color(color).multiplyScalar(isHighlighted ? 0.08 : 0.03)
    });

    nodeMaterialCache.set(key, material);
    return material;
  }

  function createNodeObject(node: ForceGraphNode): THREE.Object3D {
    const nodeId = String(node.id);
    const isPathNode = pathNodeIds.has(nodeId);
    const isHighlighted = nodeId === selectedNodeId || highlightedNodeIds.has(nodeId) || isPathNode;
    const isDimmed = Boolean(selectedNodeId) && !isHighlighted;
    const showLabel =
      node.kind === 'application' ||
      isHighlighted ||
      node.kind === 'vulnerability' ||
      node.kind === 'fixed-package-version';
    const material = getNodeMaterial(node, isHighlighted, isDimmed);
    const geometry = getNodeGeometry(node.kind);
    const mesh = new THREE.Mesh(geometry, material);
    const size = Math.max(0.55, node.val * visualConfig.densityMultiplier * (isHighlighted ? 0.42 : 0.34));
    mesh.scale.setScalar(size * (isHighlighted ? visualConfig.highlightNodeBoost : 1));

    const group = new THREE.Group();
    group.add(mesh);

    if (showLabel) {
      const label = createLabelSprite(node, { selectedNodeId, highlightedNodeIds: pathNodeIds, scale, theme });
      if (label) {
        group.add(label);
      }
    }

    return group;
  }

  if (layoutMode === 'force') {
    instance.dagMode(null as any);
  } else {
    instance.dagMode(DAG_MODE_BY_LAYOUT[layoutMode]);
  }

  instance
    .backgroundColor(graphBackground)
    .showNavInfo(false)
    .dagLevelDistance(visualConfig.levelDistance)
    .nodeResolution(visualConfig.nodeResolution)
    .nodeRelSize(4)
    .nodeOpacity(1)
    .nodeVal((node: ForceGraphNode) => {
      const nodeId = String(node.id);
      const degree = degreeByNodeId.get(nodeId) ?? 0;
      const baseValue = getNodeValue(node, degree, nodeCount, visualConfig.densityMultiplier);
      const isHighlighted = highlightedNodeIds.has(nodeId) || selectedNodeId === nodeId || pathNodeIds.has(nodeId);
      const searchHit = normalizedSearch.length > 0 && node.searchText.includes(normalizedSearch);
      return baseValue * (isHighlighted || searchHit ? visualConfig.highlightNodeBoost : 1);
    })
    .nodeColor((node: ForceGraphNode) => {
      const nodeId = String(node.id);
      const searchHit = normalizedSearch.length > 0 && node.searchText.includes(normalizedSearch);
      const isHighlighted = highlightedNodeIds.has(nodeId) || selectedNodeId === nodeId || pathNodeIds.has(nodeId) || searchHit;
      const isDimmed = Boolean(selectedNodeId) && !isHighlighted;
      return getSemanticNodeColor(node, theme, scale, colorMode, isHighlighted, isDimmed);
    })
    .nodeThreeObject((node: ForceGraphNode) => createNodeObject(node))
    .nodeThreeObjectExtend(false)
    .linkColor((link: ForceGraphLink) => {
      const linkId = getLinkId(link);
      const sourceId = resolveNodeId(link.source);
      const targetId = resolveNodeId(link.target);
      const isHighlighted =
        highlightedLinkIds.has(linkId) ||
        pathLinkIds.has(linkId) ||
        sourceId === selectedNodeId ||
        targetId === selectedNodeId;
      const isDimmed = Boolean(selectedNodeId) && !isHighlighted;
      return getSemanticLinkColor(link.predicate, theme, scale, isHighlighted, isDimmed);
    })
    .linkOpacity((link: ForceGraphLink) => {
      const linkId = getLinkId(link);
      const sourceId = resolveNodeId(link.source);
      const targetId = resolveNodeId(link.target);
      const isHighlighted =
        highlightedLinkIds.has(linkId) ||
        pathLinkIds.has(linkId) ||
        sourceId === selectedNodeId ||
        targetId === selectedNodeId;
      if (isHighlighted) {
        return 0.95;
      }

      return visualConfig.linkOpacity;
    })
    .linkWidth((link: ForceGraphLink) => {
      const linkId = getLinkId(link);
      const sourceId = resolveNodeId(link.source);
      const targetId = resolveNodeId(link.target);
      const isHighlighted =
        highlightedLinkIds.has(linkId) ||
        pathLinkIds.has(linkId) ||
        sourceId === selectedNodeId ||
        targetId === selectedNodeId;
      return isHighlighted ? visualConfig.linkWidth * visualConfig.highlightLinkWidthBoost : visualConfig.linkWidth;
    })
    .linkDirectionalArrowLength((link: ForceGraphLink) => {
      const linkId = getLinkId(link);
      const sourceId = resolveNodeId(link.source);
      const targetId = resolveNodeId(link.target);
      const isHighlighted =
        highlightedLinkIds.has(linkId) ||
        pathLinkIds.has(linkId) ||
        sourceId === selectedNodeId ||
        targetId === selectedNodeId;
      if (scale === 'very-large' && !isHighlighted) {
        return 0;
      }

      return isHighlighted ? Math.max(2, visualConfig.arrowLength || 0) : visualConfig.arrowLength;
    })
    .linkDirectionalArrowRelPos(0.92)
    .linkDirectionalParticles((link: ForceGraphLink) => {
      const linkId = getLinkId(link);
      return highlightedLinkIds.has(linkId) || pathLinkIds.has(linkId) ? 2 : 0;
    })
    .linkDirectionalParticleSpeed(0.008)
    .nodeLabel((node: ForceGraphNode) => buildNodeTooltip(node, incomingByNodeId, outgoingByNodeId))
    .warmupTicks(visualConfig.warmupTicks)
    .cooldownTicks(visualConfig.cooldownTicks)
    .onNodeClick((node: ForceGraphNode) => {
      onSelectNodeRef.current(String(node.id));
      focusNode(graphInstance, node);
    })
    .onNodeRightClick((node: ForceGraphNode) => {
      onToggleExpandNodeRef.current(String(node.id));
    });
}

function createLabelSprite(
  node: ForceGraphNode,
  options: {
    selectedNodeId: string | null;
    highlightedNodeIds: Set<string>;
    scale: GraphScale;
    theme: Theme;
  }
): SpriteText | undefined {
  const nodeId = String(node.id);
  const isSelected = options.selectedNodeId === nodeId;
  const isHighlighted = options.highlightedNodeIds.has(nodeId) || isSelected;
  const isPersistent = node.kind === 'application' || isSelected || isHighlighted || node.kind === 'vulnerability' || node.kind === 'fixed-package-version';

  if (!isPersistent) {
    return undefined;
  }

  const sprite = new SpriteText(formatCompactLabel(node));
  sprite.color = options.theme.palette.text.primary;
  sprite.textHeight = getLabelTextHeight(options.scale, node.kind === 'application');
  sprite.backgroundColor = getLabelBackground(options.theme);
  sprite.padding = 2.5;
  sprite.borderRadius = 4;
  sprite.borderWidth = 0.5;
  sprite.borderColor = options.theme.palette.divider;
  (sprite as unknown as { position: { set(x: number, y: number, z: number): void } }).position.set(
    0,
    node.kind === 'application' ? 11 : isHighlighted ? 7.5 : 6,
    0
  );
  return sprite;
}

function buildNodeTooltip(
  node: ForceGraphNode,
  incomingByNodeId: Map<string, number>,
  outgoingByNodeId: Map<string, number>
): string {
  const incoming = incomingByNodeId.get(String(node.id)) ?? 0;
  const outgoing = outgoingByNodeId.get(String(node.id)) ?? 0;
  const rows = [
    escapePercent(node.name),
    `Version: ${escapePercent(node.version ?? 'Not provided')}`,
    `Node type: ${escapePercent(node.type ?? 'Not provided')}`,
    `PURL: ${escapePercent(node.purl ?? 'Not provided')}`,
    `Incoming dependencies: ${incoming}`,
    `Outgoing dependencies: ${outgoing}`,
    `Vulnerability status: ${describeVulnerabilityStatus(node.kind)}`
  ];

  return rows.join('\n');
}

function describeVulnerabilityStatus(kind: DependencyGraphNode['kind']): string {
  switch (kind) {
    case 'vulnerability':
      return 'Vulnerability node';
    case 'vulnerable-package':
      return 'Vulnerable package';
    case 'fixed-package-version':
      return 'Fixed version';
    case 'unresolved':
      return 'Unresolved';
    default:
      return 'Not flagged';
  }
}

function formatNodeLabel(node: GraphNodeData): string {
  const name = escapePercent(node.name);
  const version = node.version ? escapePercent(node.version) : null;

  return version ? `${name} • ${version}` : name;
}

function formatCompactLabel(node: GraphNodeData): string {
  const name = escapePercent(node.name);
  const version = node.version ? escapePercent(node.version) : null;
  return version ? `${truncate(name, 28)}\n${truncate(version, 22)}` : truncate(name, 28);
}

function focusNode(
  graphInstance: ForceGraph3DInstance<ForceGraphNode, ForceGraphLink> | null,
  node: ForceGraphNode
) {
  if (!graphInstance) {
    return;
  }

  const x = typeof node.x === 'number' ? node.x : 0;
  const y = typeof node.y === 'number' ? node.y : 0;
  const z = typeof node.z === 'number' ? node.z : 0;

  graphInstance.cameraPosition({ x, y, z: z + 160 }, { x, y, z }, 900);
}

function scheduleFit(graphInstance: ForceGraph3DInstance<ForceGraphNode, ForceGraphLink>) {
  window.setTimeout(() => {
    graphInstance.zoomToFit(700, 40);
  }, 250);
}

function resolveNodeId(value: string | ForceGraphNode | undefined): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value.id === 'string') {
    return value.id;
  }

  return null;
}

function resolveNodeKind(node: GraphNodeData): DependencyGraphNode['kind'] {
  if (node.isApplication) {
    return 'application';
  }

  const normalizedType = node.type ? node.type.replace(/[^a-zA-Z]/g, '').toUpperCase() : '';
  if (normalizedType.includes('VULNERABILITY')) {
    return 'vulnerability';
  }
  if (normalizedType.includes('FIXED')) {
    return 'fixed-package-version';
  }
  if (normalizedType.includes('UNRESOLVED')) {
    return 'unresolved';
  }
  if (normalizedType.includes('VULNERABLE')) {
    return 'vulnerable-package';
  }
  if (normalizedType.includes('PACKAGEVERSION')) {
    return 'package-version';
  }
  return 'package';
}

function resolveNodeValue(node: GraphNodeData, degree: number): number {
  const degreeScale = 1 + Math.log2(Math.max(1, degree));

  if (node.isApplication) {
    return clampNumber(13.5 * degreeScale, 10, 22);
  }

  const normalizedType = node.type ? node.type.replace(/[^a-zA-Z]/g, '').toUpperCase() : '';
  if (normalizedType.includes('VULNERABILITY')) {
    return clampNumber(8.5 * degreeScale, 4.5, 14);
  }

  if (normalizedType.includes('FIXED')) {
    return clampNumber(7.2 * degreeScale, 4, 12);
  }

  if (normalizedType.includes('UNRESOLVED')) {
    return clampNumber(2.2 * degreeScale, 1.2, 4.5);
  }

  if (normalizedType.includes('VULNERABLE')) {
    return clampNumber(6.2 * degreeScale, 3.5, 10.5);
  }

  if (normalizedType.includes('PACKAGEVERSION')) {
    return clampNumber(3.4 * degreeScale, 1.4, 8.5);
  }

  return clampNumber(2.4 * degreeScale, 1.1, 6.5);
}

function resolveNodeOpacity(
  node: ForceGraphNode,
  isHighlighted: boolean,
  isDimmed: boolean,
  visualConfig: ReturnType<typeof getGraphVisualConfig>
): number {
  if (node.kind === 'application') {
    return 1;
  }

  if (isHighlighted) {
    return 1;
  }

  if (isDimmed) {
    return node.depth <= 1 ? 0.22 : visualConfig.nodeOpacity * 0.18;
  }

  if (node.depth <= 1) {
    return Math.max(0.64, visualConfig.nodeOpacity);
  }

  if (node.depth === 2) {
    return Math.max(0.48, visualConfig.nodeOpacity * 0.78);
  }

  return visualConfig.nodeOpacity;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
