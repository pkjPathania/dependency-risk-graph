import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import ZoomOutOutlinedIcon from '@mui/icons-material/ZoomOutOutlined';
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme, type Theme } from '@mui/material/styles';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import type { ImpactGraph, ImpactGraphNode } from '../../api/types';

interface CveImpactGraphProps {
  graph: ImpactGraph;
  selectedExposureId: string | null;
  onSelectExposure: (exposureId: string | null) => void;
  onSelectNode: (node: ImpactGraphNode) => void;
}

interface SimulationNode extends d3.SimulationNodeDatum, ImpactGraphNode {}
interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  id: string;
  relationship: string;
  exposureIds: string[];
}

export function CveImpactGraph({
  graph,
  selectedExposureId,
  onSelectExposure,
  onSelectNode
}: CveImpactGraphProps) {
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const svgElement = svgRef.current;
    if (!host || !svgElement || graph.nodes.length === 0) return;

    const width = Math.max(host.clientWidth, 760);
    const height = Math.max(host.clientHeight, 480);
    const svg = d3.select(svgElement).attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    for (const relationship of ['DEPENDS_ON', 'AFFECTED_BY', 'FIXED_IN']) {
      defs.append('marker')
        .attr('id', `impact-arrow-${relationship}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 16)
        .attr('refY', 0)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', edgeColor(relationship, theme.palette));
    }

    const root = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 2.8])
      .on('zoom', (event) => root.attr('transform', event.transform));
    zoomRef.current = zoom;
    svg.call(zoom);

    const nodes: SimulationNode[] = graph.nodes.map((node) => ({ ...node }));
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const links: SimulationLink[] = graph.edges.map((edge) => ({
      ...edge,
      source: nodeById.get(edge.source) ?? edge.source,
      target: nodeById.get(edge.target) ?? edge.target
    }));

    const edgeGroup = root.append('g').selectAll('g').data(links).join('g');
    const edgeLines = edgeGroup.append('line')
      .attr('stroke', (link) => edgeColor(link.relationship, theme.palette))
      .attr('stroke-width', (link) => link.relationship === 'DEPENDS_ON' ? 1.7 : 2.7)
      .attr('marker-end', (link) => `url(#impact-arrow-${link.relationship})`);
    const edgeLabels = edgeGroup.append('text')
      .text((link) => link.relationship)
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', 9)
      .attr('font-weight', 800)
      .attr('text-anchor', 'middle')
      .attr('paint-order', 'stroke')
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 4);

    const nodeGroups = root.append('g').selectAll('g').data(nodes).join('g')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (node) => `${node.nodeType}: ${node.label ?? node.id}`)
      .style('cursor', 'pointer')
      .on('click', (_, node) => {
        onSelectNode(node);
        if (node.nodeType === 'APPLICATION') {
          const exposure = graph.edges.find((edge) =>
            edge.source === node.id && edge.exposureIds.length > 0
          )?.exposureIds[0] ?? null;
          onSelectExposure(exposure);
        }
      });

    nodeGroups.append('rect')
      .attr('x', (node) => -nodeWidth(node) / 2)
      .attr('y', (node) => -nodeHeight(node) / 2)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', (node) => node.nodeType === 'VULNERABILITY' ? 18 : 10)
      .attr('fill', (node) => nodeFill(node.nodeType, theme.palette))
      .attr('stroke', (node) => nodeStroke(node.nodeType, theme.palette))
      .attr('stroke-width', (node) => node.nodeType === 'VULNERABILITY' ? 3 : 1.5);

    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.primary)
      .attr('font-size', (node) => node.nodeType === 'VULNERABILITY' ? 13 : 11)
      .attr('font-weight', 900)
      .each(function (node) {
        const text = d3.select(this);
        text.append('tspan').attr('x', 0).attr('dy', node.nodeType === 'VULNERABILITY' ? '-2.15em' : node.version ? '-0.15em' : '0.35em')
          .text(truncate(node.label ?? node.id, node.nodeType === 'VULNERABILITY' ? 28 : 22));
        if (node.nodeType === 'VULNERABILITY') {
          text.append('tspan').attr('x', 0).attr('dy', '1.35em').attr('font-size', 10).attr('font-weight', 700)
            .text(String(node.metadata.osvId ?? ''));
          text.append('tspan').attr('x', 0).attr('dy', '1.35em').attr('font-size', 10).attr('font-weight', 900)
            .text(String(node.metadata.severity ?? 'UNRATED'));
          text.append('tspan').attr('x', 0).attr('dy', '1.35em').attr('font-size', 9).attr('font-weight', 700)
            .text(`${node.metadata.affectedApplicationCount ?? 0} apps · ${node.metadata.affectedPackageVersionCount ?? 0} packages`);
        }
        if (node.version) {
          text.append('tspan').attr('x', 0).attr('dy', '1.35em')
            .attr('font-size', 10).attr('font-weight', 700)
            .text(node.version);
        }
      });

    if (!selectedExposureId) {
      nodeGroups.attr('opacity', 1);
      edgeGroup.attr('opacity', 1);
    } else {
      const activeNodeIds = new Set<string>();
      edgeGroup.attr('opacity', (edge) => {
        const active = edge.relationship === 'FIXED_IN' || edge.exposureIds.includes(selectedExposureId);
        if (active) {
          activeNodeIds.add((edge.source as SimulationNode).id);
          activeNodeIds.add((edge.target as SimulationNode).id);
        }
        return active ? 1 : 0.12;
      });
      nodeGroups.attr('opacity', (node) => activeNodeIds.has(node.id) || node.nodeType === 'VULNERABILITY' ? 1 : 0.15);
    }

    const maxDependencyDepth = dependencyDepth(graph);
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(links).id((node) => node.id).distance(135).strength(0.9))
      .force('charge', d3.forceManyBody().strength(-650))
      .force('collide', d3.forceCollide<SimulationNode>().radius((node) => nodeWidth(node) * 0.62))
      .force('x', d3.forceX<SimulationNode>((node) => targetX(node, width, graph, maxDependencyDepth)).strength(1))
      .force('y', d3.forceY<SimulationNode>(height / 2).strength(0.12))
      .alphaDecay(0.045)
      .on('tick', () => {
        nodeGroups.attr('transform', (node) => `translate(${node.x ?? 0},${node.y ?? 0})`);
        edgeLines
          .attr('x1', (link) => (link.source as SimulationNode).x ?? 0)
          .attr('y1', (link) => (link.source as SimulationNode).y ?? 0)
          .attr('x2', (link) => (link.target as SimulationNode).x ?? 0)
          .attr('y2', (link) => (link.target as SimulationNode).y ?? 0);
        edgeLabels
          .attr('x', (link) => (((link.source as SimulationNode).x ?? 0) + ((link.target as SimulationNode).x ?? 0)) / 2)
          .attr('y', (link) => (((link.source as SimulationNode).y ?? 0) + ((link.target as SimulationNode).y ?? 0)) / 2 - 5);
      })
      .on('end', () => fit(svg, zoom, root, width, height));

    return () => { simulation.stop(); };
  }, [graph, onSelectExposure, onSelectNode, selectedExposureId, theme]);

  function zoomBy(factor: number) {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(180).call(zoomRef.current.scaleBy, factor);
    }
  }

  function fitGraph() {
    const svg = svgRef.current;
    const root = svg?.querySelector('g');
    if (svg && root && zoomRef.current) {
      fit(d3.select(svg), zoomRef.current, d3.select(root), Math.max(svg.clientWidth, 760), Math.max(svg.clientHeight, 480));
    }
  }

  return (
    <Paper variant="outlined" sx={{ position: 'relative', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Box ref={hostRef} sx={{ height: { xs: 500, lg: 620 }, minWidth: 0 }}>
        <svg ref={svgRef} width="100%" height="100%" aria-label="CVE impact graph" />
      </Box>
      <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 12, right: 12 }}>
        <Tooltip title="Zoom in"><IconButton size="small" onClick={() => zoomBy(1.25)}><ZoomInOutlinedIcon /></IconButton></Tooltip>
        <Tooltip title="Zoom out"><IconButton size="small" onClick={() => zoomBy(0.8)}><ZoomOutOutlinedIcon /></IconButton></Tooltip>
        <Tooltip title="Fit graph"><IconButton size="small" onClick={fitGraph}><CenterFocusStrongOutlinedIcon /></IconButton></Tooltip>
      </Stack>
      <GraphLegend />
    </Paper>
  );
}

function targetX(node: SimulationNode, width: number, graph: ImpactGraph, maxDepth: number): number {
  if (node.nodeType === 'APPLICATION') return 90;
  if (node.nodeType === 'VULNERABILITY') return width * 0.72;
  if (node.nodeType === 'FIXED_VERSION') return width - 90;
  if (node.nodeType === 'VULNERABLE_PACKAGE') return width * 0.56;
  const depth = graphDepth(graph, node.id);
  return 90 + (width * 0.42 * Math.max(1, depth)) / Math.max(2, maxDepth + 1);
}

function dependencyDepth(graph: ImpactGraph): number {
  return Math.max(1, ...graph.nodes.map((node) => graphDepth(graph, node.id)));
}

function graphDepth(graph: ImpactGraph, nodeId: string): number {
  const applications = new Set(graph.nodes.filter((node) => node.nodeType === 'APPLICATION').map((node) => node.id));
  if (applications.has(nodeId)) return 0;
  const incoming = new Map<string, string[]>();
  graph.edges.filter((edge) => edge.relationship === 'DEPENDS_ON').forEach((edge) => {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
  });
  const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
  const visited = new Set<string>();
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    if (applications.has(current.id)) return current.depth;
    for (const parent of incoming.get(current.id) ?? []) queue.push({ id: parent, depth: current.depth + 1 });
  }
  return 1;
}

function fit(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
  root: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number
) {
  const bounds = root.node()?.getBBox();
  if (!bounds || bounds.width === 0 || bounds.height === 0) return;
  const scale = Math.min(1.35, 0.88 / Math.max(bounds.width / width, bounds.height / height));
  const transform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-(bounds.x + bounds.width / 2), -(bounds.y + bounds.height / 2));
  svg.transition().duration(250).call(zoom.transform, transform);
}

function nodeWidth(node: SimulationNode): number { return node.nodeType === 'VULNERABILITY' ? 210 : 150; }
function nodeHeight(node: SimulationNode): number { return node.nodeType === 'VULNERABILITY' ? 112 : 58; }
function truncate(value: string, length: number): string { return value.length > length ? `${value.slice(0, length - 1)}…` : value; }

function nodeFill(type: string, palette: Theme['palette']): string {
  if (type === 'VULNERABILITY') return palette.error.light;
  if (type === 'FIXED_VERSION') return palette.success.light;
  if (type === 'VULNERABLE_PACKAGE') return palette.warning.light;
  if (type === 'APPLICATION') return palette.primary.light;
  return palette.background.paper;
}

function nodeStroke(type: string, palette: Theme['palette']): string {
  if (type === 'VULNERABILITY') return palette.error.main;
  if (type === 'FIXED_VERSION') return palette.success.main;
  if (type === 'VULNERABLE_PACKAGE') return palette.warning.main;
  if (type === 'APPLICATION') return palette.primary.main;
  return palette.divider;
}

function edgeColor(relationship: string, palette: Theme['palette']): string {
  if (relationship === 'AFFECTED_BY') return palette.error.main;
  if (relationship === 'FIXED_IN') return palette.success.main;
  return palette.primary.main;
}

function GraphLegend() {
  return (
    <Paper variant="outlined" sx={{ position: 'absolute', left: 12, bottom: 12, p: 1 }}>
      <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
        {['Application', 'Dependency', 'Vulnerable package', 'Vulnerability', 'Fixed version'].map((label) => (
          <Typography key={label} variant="caption" fontWeight={700}>{label}</Typography>
        ))}
      </Stack>
    </Paper>
  );
}
