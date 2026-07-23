import { Box, Paper, Stack, Typography } from '@mui/material';
import { hierarchy, tree, type HierarchyPointNode } from 'd3';
import { useMemo, useState } from 'react';
import type { CveImpactDetailResponse, ExposurePath, ImpactGraphNode, PathNodeView } from '../../api/types';
import { designTokens } from '../../theme/designTokens';

interface CveImpactTreeProps {
  detail: CveImpactDetailResponse;
  selectedExposureId: string | null;
  onSelectNode: (node: ImpactGraphNode, anchor: SVGGElement) => void;
  onSelectExposure: (exposureId: string) => void;
}

type TreeSide = 'left' | 'right';
type TreeNodeKind = 'cve' | 'application' | 'dependency' | 'package' | 'fix';

interface TreeDatum {
  id: string;
  mergeKey: string;
  backendNodeIri: string;
  exposureId?: string;
  label: string;
  version: string | null;
  kind: TreeNodeKind;
  children?: TreeDatum[];
}

interface PositionedNode {
  key: string;
  datum: TreeDatum;
  x: number;
  y: number;
  side: TreeSide;
  depth: number;
  identity: string;
}

interface PositionedLink {
  key: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  side: TreeSide;
  relationship: 'DEPENDS_ON' | 'AFFECTED_BY' | 'FIXED_IN';
  sourceIdentity: string;
  targetIdentity: string;
  exposureIds: string[];
}

const LEVEL_GAP = 150;
const ROW_GAP = 72;
const MIN_HALF_WIDTH = 410;
const MIN_HEIGHT = 420;
const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 500;
const VIEWBOX_MARGIN = 34;

export function CveImpactTree({
  detail,
  selectedExposureId,
  onSelectNode,
  onSelectExposure
}: CveImpactTreeProps) {
  const layout = useMemo(() => buildSplitTreeLayout(detail), [detail]);
  const nodeRadius = Math.max(4, Math.min(13, 180 / Math.max(1, layout.nodes.length)));
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const selectNode = (node: PositionedNode, anchor: SVGGElement) => {
    setSelectedIdentity(node.identity);
    onSelectNode(resolveBackendNode(detail, node.datum), anchor);
    if (node.datum.exposureId) onSelectExposure(node.datum.exposureId);
  };

  return (
    <Paper
      variant="outlined"
      aria-label="CVE impact and fixes tree"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: designTokens.surface.app,
        minHeight: 500,
        height: '100%',
        '@keyframes selectedExposureFlow': {
          to: { strokeDashoffset: -12 }
        },
        '& .selected-exposure-path': {
          animation: 'selectedExposureFlow 700ms linear infinite'
        }
      }}
    >
      <TreeVocabulary />
      <Box
        sx={{
          minHeight: 500,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="svg"
          role="img"
          aria-label="CVE impact and provided fixes tree"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="xMidYMid meet"
          sx={{ display: 'block', width: '100%', height: 500, maxWidth: '100%' }}
        >
          <title id="cve-tree-title">CVE impact and provided fixes tree</title>
          <desc id="cve-tree-description">
            The selected CVE is centered, impacted applications and dependency paths extend left, and provided fixes extend right.
          </desc>
          <g>
            {layout.links.map((link) => (
              <g key={link.key}>
                <path
                  d={treeLinkPath(link)}
                  fill="none"
                  stroke={link.side === 'left' ? designTokens.shell.topbar : designTokens.accent.lime}
                  strokeWidth={2}
                  strokeOpacity={0.78}
                  vectorEffect="non-scaling-stroke"
                />
                {selectedExposureId && link.exposureIds.includes(selectedExposureId) ? (
                  <path
                    className="selected-exposure-path"
                    data-exposure-active="true"
                    d={treeLinkPath(link)}
                    fill="none"
                    stroke={designTokens.accent.lime}
                    strokeWidth={4}
                    strokeDasharray="1 6"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                ) : null}
                <EdgeLabel link={link} />
              </g>
            ))}
          </g>
          <g>
            {layout.nodes.map((node) => (
              <TreeNode
                key={node.key}
                node={node}
                baseRadius={nodeRadius}
                selected={selectedIdentity === node.identity}
                onSelect={(anchor) => selectNode(node, anchor)}
              />
            ))}
          </g>
        </Box>
      </Box>
    </Paper>
  );
}

function TreeNode({
  node,
  baseRadius,
  selected,
  onSelect
}: {
  node: PositionedNode;
  baseRadius: number;
  selected: boolean;
  onSelect: (anchor: SVGGElement) => void;
}) {
  const root = node.datum.kind === 'cve';
  const radius = root ? baseRadius * 1.45 : baseRadius;
  const application = node.datum.kind === 'application';
  const fix = node.datum.kind === 'fix';
  const labelAnchor = application ? 'start' : fix ? 'end' : 'middle';
  const labelX = application ? radius + 5 : fix ? -(radius + 5) : 0;
  const labelY = root ? radius + 16 : application || fix ? -2 : -(radius + 7);
  const versionY = root ? labelY + 12 : application || fix ? labelY + 12 : radius + 12;
  const labelSize = Math.max(6.5, Math.min(11, baseRadius));
  const versionSize = Math.max(5.5, labelSize - 1.5);
  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      data-node-kind={node.datum.kind}
      data-node-radius={radius.toFixed(2)}
      role="button"
      tabIndex={0}
      aria-label={`${node.datum.label}${node.datum.version ? ` ${node.datum.version}` : ''}`}
      onClick={(event) => onSelect(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(event.currentTarget);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <circle
        r={radius}
        fill={nodeFill(node.datum.kind)}
        stroke={selected ? designTokens.accent.lime : nodeStroke(node.datum.kind)}
        strokeWidth={selected ? 4 : root ? 3 : 2}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor={labelAnchor}
        fill={designTokens.text.primary}
        fontSize={labelSize}
        fontWeight={800}
      >
        {truncate(node.datum.label, 24)}
      </text>
      {node.datum.version ? (
        <text
          x={labelX}
          y={versionY}
          textAnchor={labelAnchor}
          fill={designTokens.text.secondary}
          fontSize={versionSize}
          fontWeight={600}
        >
          {truncate(node.datum.version, 20)}
        </text>
      ) : null}
      <title>{`${node.datum.label}${node.datum.version ? ` ${node.datum.version}` : ''}`}</title>
    </g>
  );
}

function EdgeLabel({ link }: { link: PositionedLink }) {
  const x = (link.sourceX + link.targetX) / 2;
  const y = (link.sourceY + link.targetY) / 2;
  return (
    <g transform={`translate(${x},${y})`} data-edge-relationship={link.relationship}>
      <rect
        x={-14}
        y={-9}
        width={28}
        height={18}
        rx={4}
        fill={designTokens.surface.card}
        stroke={designTokens.border.default}
      />
      <text textAnchor="middle" dominantBaseline="central" fill={designTokens.text.secondary} fontSize={8.5} fontWeight={900}>
        {relationshipAbbreviation(link.relationship)}
      </text>
    </g>
  );
}

function TreeVocabulary() {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      useFlexGap
      flexWrap="wrap"
      aria-label="Tree relationship vocabulary"
      sx={{
        position: 'absolute',
        top: 8,
        left: 12,
        zIndex: 1,
        justifyContent: 'flex-start'
      }}
    >
      <VocabularyItem abbreviation="DO" relationship="DEPENDS_ON" />
      <VocabularyItem abbreviation="AB" relationship="AFFECTED_BY" />
      <VocabularyItem abbreviation="FI" relationship="FIXED_IN" />
    </Stack>
  );
}

function VocabularyItem({ abbreviation, relationship }: { abbreviation: string; relationship: string }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" fontWeight={950}>{abbreviation}</Typography>
      <Typography variant="caption" color="text.secondary">{relationship}</Typography>
    </Stack>
  );
}

export function buildSplitTreeLayout(detail: CveImpactDetailResponse) {
  const rootDatum: TreeDatum = {
    id: detail.vulnerability.iri,
    mergeKey: vulnerabilityIdentity(detail),
    backendNodeIri: detail.vulnerability.iri,
    label: detail.vulnerability.preferredIdentifier,
    version: null,
    kind: 'cve'
  };
  const leftRoot: TreeDatum = {
    ...rootDatum,
    children: detail.exposures.map(impactBranch)
  };
  const rightRoot: TreeDatum = {
    ...rootDatum,
    children: detail.fixedVersions.map((fixed, index) => ({
      id: fixed.iri ?? `fix:${fixed.packageName}:${fixed.version}:${index}`,
      mergeKey: fixedIdentity(fixed.packageName, fixed.version, fixed.purl, fixed.iri),
      backendNodeIri: fixed.iri ?? `fix:${fixed.packageName}:${fixed.version}:${index}`,
      label: fixed.packageName ?? 'Fixed version',
      version: fixed.version,
      kind: 'fix' as const
    }))
  };

  const left = positionTree(leftRoot);
  const right = positionTree(rightRoot);
  const maxDepth = Math.max(
    1,
    ...left.descendants().map((node) => node.depth),
    ...right.descendants().map((node) => node.depth)
  );
  const leafCount = Math.max(1, left.leaves().length, right.leaves().length);
  const halfWidth = Math.max(MIN_HALF_WIDTH, maxDepth * LEVEL_GAP + 150);
  const width = halfWidth * 2;
  const height = Math.max(MIN_HEIGHT, leafCount * ROW_GAP + 150);
  const centerX = width / 2;
  const centerY = height / 2;

  const leftNodes = mapNodes(left, 'left', centerX, centerY).filter((node) => node.depth > 0);
  const rightNodes = mapNodes(right, 'right', centerX, centerY).filter((node) => node.depth > 0);
  const centerNode: PositionedNode = {
    key: `center:${rootDatum.id}`,
    datum: rootDatum,
    x: centerX,
    y: centerY,
    side: 'right',
    depth: 0,
    identity: rootDatum.mergeKey
  };
  const rawNodes = [centerNode, ...leftNodes, ...rightNodes];
  const rawLinks = [...mapLinks(left, 'left', centerX, centerY), ...mapLinks(right, 'right', centerX, centerY)];
  const merged = mergePositionedTree(rawNodes, rawLinks);
  const fitted = fitTreeToViewport(merged.nodes, merged.links, rootDatum.mergeKey);

  return {
    width: VIEWBOX_WIDTH,
    height: VIEWBOX_HEIGHT,
    nodes: fitted.nodes,
    links: fitted.links
  };
}

function positionTree(data: TreeDatum): HierarchyPointNode<TreeDatum> {
  const root = hierarchy(data);
  return tree<TreeDatum>()
    .nodeSize([ROW_GAP, LEVEL_GAP])
    .separation((left, right) => left.parent === right.parent ? 1 : 1.15)(root);
}

function mapNodes(
  root: HierarchyPointNode<TreeDatum>,
  side: TreeSide,
  centerX: number,
  centerY: number
): PositionedNode[] {
  return root.descendants().map((node, index) => ({
    key: `${side}:${node.data.id}:${index}`,
    datum: node.data,
    x: centerX + (side === 'left' ? -node.y : node.y),
    y: centerY + node.x,
    side,
    depth: node.depth,
    identity: node.data.mergeKey
  }));
}

function mapLinks(
  root: HierarchyPointNode<TreeDatum>,
  side: TreeSide,
  centerX: number,
  centerY: number
): PositionedLink[] {
  return root.links().map((link, index) => {
    const relationship = side === 'right'
      ? 'FIXED_IN'
      : link.source.data.kind === 'cve'
        ? 'AFFECTED_BY'
        : 'DEPENDS_ON';
    return {
      key: `${side}:${link.source.data.id}:${link.target.data.id}:${index}`,
      sourceX: centerX + (side === 'left' ? -link.source.y : link.source.y),
      sourceY: centerY + link.source.x,
      targetX: centerX + (side === 'left' ? -link.target.y : link.target.y),
      targetY: centerY + link.target.x,
      side,
      relationship,
      sourceIdentity: link.source.data.mergeKey,
      targetIdentity: link.target.data.mergeKey,
      exposureIds: link.target.data.exposureId
        ? [link.target.data.exposureId]
        : link.source.data.exposureId
          ? [link.source.data.exposureId]
          : []
    };
  });
}

function mergePositionedTree(nodes: PositionedNode[], links: PositionedLink[]) {
  const groups = new Map<string, PositionedNode[]>();
  nodes.forEach((node) => groups.set(node.identity, [...(groups.get(node.identity) ?? []), node]));
  const mergedNodes = Array.from(groups, ([identity, matching]) => {
    if (matching.length === 1) return matching[0];
    return {
      ...matching[0],
      key: `merged:${identity}`,
      x: average(matching.map((node) => node.x)),
      y: average(matching.map((node) => node.y)),
      depth: Math.min(...matching.map((node) => node.depth))
    };
  });
  const positionByIdentity = new Map(mergedNodes.map((node) => [node.identity, node]));
  const linksByTuple = new Map<string, PositionedLink>();
  links.forEach((link) => {
    if (link.sourceIdentity === link.targetIdentity) return;
    const source = positionByIdentity.get(link.sourceIdentity);
    const target = positionByIdentity.get(link.targetIdentity);
    if (!source || !target) return;
    const tuple = `${link.sourceIdentity}\u0000${link.relationship}\u0000${link.targetIdentity}`;
    const existing = linksByTuple.get(tuple);
    if (existing) {
      existing.exposureIds = Array.from(new Set([...existing.exposureIds, ...link.exposureIds]));
      return;
    }
    linksByTuple.set(tuple, {
      ...link,
      key: `merged-link:${tuple}`,
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y
    });
  });
  return { nodes: mergedNodes, links: Array.from(linksByTuple.values()) };
}

function fitTreeToViewport(
  nodes: PositionedNode[],
  links: PositionedLink[],
  rootIdentity: string
) {
  const root = nodes.find((node) => node.identity === rootIdentity);
  if (!root) return { nodes, links };
  const leftSpan = Math.max(1, ...nodes.filter((node) => node.x < root.x).map((node) => root.x - node.x));
  const rightSpan = Math.max(1, ...nodes.filter((node) => node.x > root.x).map((node) => node.x - root.x));
  const upperSpan = Math.max(1, ...nodes.filter((node) => node.y < root.y).map((node) => root.y - node.y));
  const lowerSpan = Math.max(1, ...nodes.filter((node) => node.y > root.y).map((node) => node.y - root.y));
  const centerX = VIEWBOX_WIDTH / 2;
  const centerY = VIEWBOX_HEIGHT / 2;
  const horizontalSpace = centerX - VIEWBOX_MARGIN;
  const verticalSpace = centerY - VIEWBOX_MARGIN;
  const fittedNodes = nodes.map((node) => {
    const deltaX = node.x - root.x;
    const deltaY = node.y - root.y;
    return {
      ...node,
      x: centerX + deltaX * (horizontalSpace / (deltaX < 0 ? leftSpan : rightSpan)),
      y: centerY + deltaY * (verticalSpace / (deltaY < 0 ? upperSpan : lowerSpan))
    };
  });
  const positionByIdentity = new Map(fittedNodes.map((node) => [node.identity, node]));
  const fittedLinks = links.map((link) => {
    const source = positionByIdentity.get(link.sourceIdentity)!;
    const target = positionByIdentity.get(link.targetIdentity)!;
    return {
      ...link,
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y
    };
  });
  return { nodes: fittedNodes, links: fittedLinks };
}

function impactBranch(exposure: ExposurePath, exposureIndex: number): TreeDatum {
  const ordered = normalizedImpactPath(exposure);
  const rootFirst = [...ordered].reverse();
  let branch: TreeDatum | undefined;
  for (let index = rootFirst.length - 1; index >= 0; index -= 1) {
    const current = rootFirst[index];
    branch = {
      id: `${exposure.exposureId}:${current.iri}`,
      mergeKey: pathNodeIdentity(current, exposure),
      backendNodeIri: current.iri,
      exposureId: exposure.exposureId,
      label: current.label ?? current.iri,
      version: current.version,
      kind: pathNodeKind(current, exposure),
      children: branch ? [branch] : undefined
    };
  }
  return branch ?? {
    id: `${exposure.exposureId}:application:${exposureIndex}`,
    mergeKey: `application:${exposure.application.iri}`,
    backendNodeIri: exposure.application.iri,
    exposureId: exposure.exposureId,
    label: exposure.application.name,
    version: exposure.application.version,
    kind: 'application'
  };
}

function vulnerabilityIdentity(detail: CveImpactDetailResponse): string {
  const advisory = detail.vulnerability.osvId.trim().toLowerCase()
    || detail.vulnerability.preferredIdentifier.trim().toLowerCase();
  return `vulnerability:${advisory}`;
}

function fixedIdentity(
  packageName: string | null,
  version: string,
  purl: string | null,
  iri: string | null
): string {
  if (purl?.trim()) return `fix:purl:${purl.trim().toLowerCase()}`;
  if (packageName?.trim() && version.trim()) {
    return `fix:coordinate:${packageName.trim().toLowerCase()}\u0000${version.trim().toLowerCase()}`;
  }
  return `fix:iri:${iri ?? `${packageName}:${version}`}`;
}

function pathNodeIdentity(node: PathNodeView, exposure: ExposurePath): string {
  if (node.iri === exposure.application.iri || node.nodeType.toUpperCase().includes('APPLICATION')) {
    return `application:${exposure.application.iri}`;
  }
  if (node.purl?.trim()) return `dependency:purl:${node.purl.trim().toLowerCase()}`;
  if (node.label?.trim() && node.version?.trim()) {
    return `dependency:coordinate:${node.label.trim().toLowerCase()}\u0000${node.version.trim().toLowerCase()}`;
  }
  return `dependency:iri:${node.iri}`;
}

function normalizedImpactPath(exposure: ExposurePath): PathNodeView[] {
  const nodes = exposure.path.filter((node) => !node.nodeType.toUpperCase().includes('VULNERABILITY'));
  const application: PathNodeView = {
    iri: exposure.application.iri,
    label: exposure.application.name,
    version: exposure.application.version,
    purl: null,
    nodeType: 'APPLICATION'
  };
  const vulnerablePackage: PathNodeView = {
    iri: exposure.vulnerablePackage.iri,
    label: exposure.vulnerablePackage.name,
    version: exposure.vulnerablePackage.version,
    purl: exposure.vulnerablePackage.purl,
    nodeType: 'VULNERABLE_PACKAGE'
  };
  const withApplication = nodes.some((node) => node.iri === application.iri) ? nodes : [application, ...nodes];
  const withPackage = withApplication.some((node) => node.iri === vulnerablePackage.iri)
    ? withApplication
    : [...withApplication, vulnerablePackage];
  return withPackage.filter((node, index, all) => index === 0 || node.iri !== all[index - 1].iri);
}

function pathNodeKind(node: PathNodeView, exposure: ExposurePath): TreeNodeKind {
  if (node.iri === exposure.application.iri || node.nodeType.toUpperCase().includes('APPLICATION')) return 'application';
  if (node.iri === exposure.vulnerablePackage.iri || node.nodeType.toUpperCase().includes('PACKAGE')) return 'package';
  return 'dependency';
}

function treeLinkPath(link: PositionedLink): string {
  const midpoint = (link.sourceX + link.targetX) / 2;
  return `M${link.sourceX},${link.sourceY}C${midpoint},${link.sourceY} ${midpoint},${link.targetY} ${link.targetX},${link.targetY}`;
}

function nodeFill(kind: TreeNodeKind): string {
  if (kind === 'cve') return '#FF0000';
  if (kind === 'application') return '#1769E0';
  if (kind === 'fix') return '#B9E3E9';
  return designTokens.shell.topbar;
}

function nodeStroke(kind: TreeNodeKind): string {
  if (kind === 'cve') return '#B80000';
  if (kind === 'application') return '#8DB8FF';
  if (kind === 'fix') return designTokens.accent.lime;
  return designTokens.shell.sidebar;
}

function relationshipAbbreviation(
  relationship: PositionedLink['relationship']
): 'DO' | 'AB' | 'FI' {
  if (relationship === 'DEPENDS_ON') return 'DO';
  if (relationship === 'AFFECTED_BY') return 'AB';
  return 'FI';
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function resolveBackendNode(detail: CveImpactDetailResponse, datum: TreeDatum): ImpactGraphNode {
  const backendNode = detail.graph.nodes.find((node) =>
    node.id === datum.backendNodeIri || node.iri === datum.backendNodeIri
  );
  if (backendNode) return backendNode;
  return {
    id: datum.backendNodeIri,
    iri: datum.backendNodeIri,
    label: datum.label,
    version: datum.version,
    nodeType: treeNodeType(datum.kind),
    metadata: {}
  };
}

function treeNodeType(kind: TreeNodeKind): ImpactGraphNode['nodeType'] {
  if (kind === 'cve') return 'VULNERABILITY';
  if (kind === 'application') return 'APPLICATION';
  if (kind === 'package') return 'VULNERABLE_PACKAGE';
  if (kind === 'fix') return 'FIXED_VERSION';
  return 'DEPENDENCY';
}
