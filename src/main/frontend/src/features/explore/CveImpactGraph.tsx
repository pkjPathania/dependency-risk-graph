import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import { Box, Button, Chip, Paper, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type EdgeProps,
  type NodeProps,
  type NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ImpactGraph, ImpactGraphEdge, ImpactGraphNode } from '../../api/types';
import { designTokens } from '../../theme/designTokens';
import { layoutImpactGraph } from './cveImpactElkLayout';
import {
  projectImpactGraph,
  type ImpactFlowEdge,
  type ImpactFlowNode,
  type ImpactGraphMode
} from './cveImpactFlowModel';

interface CveImpactGraphProps {
  graph: ImpactGraph;
  selectedExposureId: string | null;
  onSelectExposure: (exposureId: string | null) => void;
  onSelectNode: (node: ImpactGraphNode) => void;
}

const nodeTypes: NodeTypes = {
  application: ApplicationNode,
  dependency: DependencyNode,
  vulnerablePackage: VulnerablePackageNode,
  vulnerability: VulnerabilityNode,
  fixedVersion: FixedVersionNode
};

const edgeTypes = { semantic: SemanticEdge };

export function CveImpactGraph(props: CveImpactGraphProps) {
  return <ReactFlowProvider><CveImpactFlow {...props} /></ReactFlowProvider>;
}

function CveImpactFlow({ graph, selectedExposureId, onSelectExposure, onSelectNode }: CveImpactGraphProps) {
  const [mode, setMode] = useState<ImpactGraphMode>('simplified');
  const [locked, setLocked] = useState(false);
  const [layoutRequest, setLayoutRequest] = useState(0);
  const initialGraph = useMemo(
    () => projectImpactGraph(graph, mode, selectedExposureId),
    [graph, mode, selectedExposureId]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<ImpactFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ImpactFlowEdge>([]);
  const { fitView, setCenter } = useReactFlow<ImpactFlowNode, ImpactFlowEdge>();

  useEffect(() => {
    let active = true;
    void layoutImpactGraph(initialGraph.nodes, initialGraph.edges).then((layout) => {
      if (!active) return;
      setNodes(layout.nodes);
      setEdges(layout.edges);
      requestAnimationFrame(() => void fitView({ padding: 0.2, maxZoom: 1, duration: 300 }));
    });
    return () => { active = false; };
  }, [fitView, initialGraph, layoutRequest, setEdges, setNodes]);

  const selectNode = useCallback((_: React.MouseEvent, node: ImpactFlowNode) => {
    onSelectNode(node.data.backendNode);
    if (node.data.backendNode.nodeType === 'APPLICATION') {
      const exposureId = graph.edges.find((edge) =>
        edge.source === node.id && edge.exposureIds.length > 0
      )?.exposureIds[0] ?? null;
      onSelectExposure(exposureId);
    }
  }, [graph.edges, onSelectExposure, onSelectNode]);

  const centreOnCve = useCallback(() => {
    const vulnerability = nodes.find((node) => node.data.backendNode.nodeType === 'VULNERABILITY');
    if (vulnerability) {
      void setCenter(vulnerability.position.x + 110, vulnerability.position.y + 46, { zoom: 1.25, duration: 350 });
    }
  }, [nodes, setCenter]);

  return (
    <Paper
      variant="outlined"
      aria-label="CVE impact graph"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: designTokens.surface.app,
        height: { xs: 460, lg: 520 },
        minHeight: 460,
        width: '100%',
        '& .react-flow__controls-button': {
          bgcolor: designTokens.surface.card,
          color: designTokens.text.primary,
          borderColor: designTokens.border.default
        },
        '& .react-flow__minimap': {
          bgcolor: designTokens.surface.panel,
          border: `1px solid ${designTokens.border.default}`
        },
        '& .react-flow__node, & .react-flow__node .MuiTypography-root, & .react-flow__node .MuiChip-root': {
          opacity: 1
        }
      }}
    >
      <Box sx={{ height: '100%', minHeight: 460, width: '100%' }}>
        <ReactFlow<ImpactFlowNode, ImpactFlowEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={selectNode}
          nodesDraggable={!locked}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.1}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={designTokens.border.default} />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap pannable zoomable nodeColor={miniMapColor} />
          <Panel position="top-right">
            <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap" justifyContent="flex-end">
              <ToggleButtonGroup
                exclusive
                size="small"
                value={mode}
                onChange={(_, value: ImpactGraphMode | null) => { if (value) setMode(value); }}
                aria-label="Graph detail mode"
                className="nodrag"
              >
                <ToggleButton value="simplified">Simplified</ToggleButton>
                <ToggleButton value="detailed">Detailed RDF</ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Fit view"><Button className="nodrag" size="small" variant="outlined" startIcon={<CenterFocusStrongOutlinedIcon />} onClick={() => void fitView({ padding: 0.2, maxZoom: 1, duration: 300 })}>Fit view</Button></Tooltip>
              <Tooltip title="Reset layout"><Button className="nodrag" size="small" variant="outlined" startIcon={<RestartAltOutlinedIcon />} onClick={() => setLayoutRequest((request) => request + 1)}>Reset layout</Button></Tooltip>
              <Tooltip title="Centre on CVE"><Button className="nodrag" size="small" variant="outlined" onClick={centreOnCve}>Centre on CVE</Button></Tooltip>
              <Tooltip title={locked ? 'Unlock node movement' : 'Lock node movement'}>
                <Button className="nodrag" size="small" variant="outlined" startIcon={locked ? <LockOutlinedIcon /> : <LockOpenOutlinedIcon />} onClick={() => setLocked((value) => !value)}>
                  {locked ? 'Unlock' : 'Lock'}
                </Button>
              </Tooltip>
            </Stack>
          </Panel>
          <Panel position="bottom-left"><GraphLegend showIdentity={mode === 'detailed'} /></Panel>
        </ReactFlow>
      </Box>
    </Paper>
  );
}

function ApplicationNode({ data, selected }: NodeProps<ImpactFlowNode>) {
  return <ImpactNodeCard data={data} selected={selected} tone="primary" kind="Application" source />;
}

function DependencyNode({ data, selected }: NodeProps<ImpactFlowNode>) {
  return <ImpactNodeCard data={data} selected={selected} tone="neutral" kind="Dependency" target source />;
}

function VulnerablePackageNode({ data, selected }: NodeProps<ImpactFlowNode>) {
  return <ImpactNodeCard data={data} selected={selected} tone="warning" kind="Vulnerable package" target source />;
}

function VulnerabilityNode({ data, selected }: NodeProps<ImpactFlowNode>) {
  return <ImpactNodeCard data={data} selected={selected} tone="error" kind="Vulnerability" target source />;
}

function FixedVersionNode({ data, selected }: NodeProps<ImpactFlowNode>) {
  return <ImpactNodeCard data={data} selected={selected} tone="success" kind="Fixed version" target />;
}

function ImpactNodeCard({ data, selected, tone, kind, target = false, source = false }: {
  data: ImpactFlowNode['data'];
  selected: boolean;
  tone: 'primary' | 'warning' | 'error' | 'success' | 'neutral';
  kind: string;
  target?: boolean;
  source?: boolean;
}) {
  const colors = nodeColors(tone);
  return (
    <Paper
      elevation={selected ? 8 : 2}
      sx={{
        width: 220,
        minHeight: 92,
        p: 1.25,
        border: 2,
        borderColor: selected ? designTokens.accent.lime : colors.border,
        bgcolor: colors.background,
        color: colors.primaryText,
        opacity: 1,
        borderRadius: tone === 'error' ? 3 : 2
      }}
    >
      {target ? <Handle type="target" position={Position.Left} style={{ background: colors.border }} /> : null}
      <Typography className="node-type" variant="overline" lineHeight={1} sx={{ color: colors.typeText, fontWeight: 700, opacity: 1 }}>{kind}</Typography>
      <Typography className="node-title" variant="body2" sx={{ mt: 0.5, color: colors.primaryText, fontWeight: 700, opacity: 1, overflowWrap: 'anywhere' }}>{data.label}</Typography>
      {data.version ? <Chip className="node-version" size="small" label={data.version} sx={{ mt: 0.75, maxWidth: '100%', color: colors.metaText, fontWeight: 500, opacity: 1 }} /> : null}
      {source ? <Handle type="source" position={Position.Right} style={{ background: colors.border }} /> : null}
    </Paper>
  );
}

function SemanticEdge(props: EdgeProps<ImpactFlowEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath(props);
  const labelColor = edgeLabelColor(props.data?.relationship);
  return (
    <>
      <BaseEdge path={path} markerEnd={props.markerEnd} style={props.style} />
      {props.label ? <EdgeLabelRenderer><Box className="react-flow__edge-text" sx={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, bgcolor: designTokens.surface.card, border: `1px solid ${designTokens.border.default}`, px: 0.5, borderRadius: 0.5, pointerEvents: 'none', color: labelColor, fontSize: 10, fontWeight: 700, lineHeight: 1.4, opacity: 1 }}>{String(props.label)}</Box></EdgeLabelRenderer> : null}
    </>
  );
}

function GraphLegend({ showIdentity }: { showIdentity: boolean }) {
  return <Paper variant="outlined" sx={{ p: 1 }}><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
    <Legend label="DEPENDS_ON" color={designTokens.security.low} />
    {showIdentity ? <Legend label="INSTANCE_OF" color={designTokens.security.unknown} dashed /> : null}
    <Legend label="AFFECTED_BY" color={designTokens.security.critical} />
    <Legend label="FIXED_IN" color={designTokens.security.safe} />
  </Stack></Paper>;
}

function Legend({ label, color, dashed = false }: { label: string; color: string; dashed?: boolean }) {
  return <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 22, borderTop: 2, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} /><Typography variant="caption" fontWeight={800}>{label}</Typography></Stack>;
}

function nodeColors(tone: 'primary' | 'warning' | 'error' | 'success' | 'neutral') {
  return designTokens.graph.node[tone];
}

function edgeLabelColor(relationship: ImpactGraphEdge['relationship'] | undefined): string {
  if (relationship === 'AFFECTED_BY') return designTokens.graph.edge.affectedBy;
  if (relationship === 'FIXED_IN') return designTokens.graph.edge.fixedIn;
  if (relationship === 'DEPENDS_ON') return designTokens.graph.edge.dependsOn;
  return designTokens.graph.edge.identity;
}

function miniMapColor(node: ImpactFlowNode): string {
  if (node.type === 'vulnerability') return designTokens.security.critical;
  if (node.type === 'fixedVersion') return designTokens.security.safe;
  if (node.type === 'vulnerablePackage') return designTokens.security.high;
  if (node.type === 'application') return designTokens.shell.topbar;
  return designTokens.security.unknown;
}
