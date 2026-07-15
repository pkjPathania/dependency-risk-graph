import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useEffect, useMemo, useRef } from 'react';
import { Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { escapePercent } from '../../api/sbomApi';
import type { GraphModel, GraphNodeData } from './graphMapper';

cytoscape.use(dagre);

interface DependencyGraphProps {
  graph: GraphModel;
  selectedNodeId: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleExpandNode: (nodeId: string) => void;
}

const stylesheet = [
  {
    selector: 'node',
    style: {
      shape: 'round-rectangle',
      width: 'label',
      height: 'label',
      padding: '16px',
      label: 'data(label)',
      'text-wrap': 'wrap',
      'text-max-width': 220,
      'font-size': 13,
      'font-weight': 600,
      color: '#172033',
      'text-valign': 'center',
      'text-halign': 'center',
      'background-color': '#ffffff',
      'border-width': 1.25,
      'border-color': '#cfd4dc',
      'text-outline-width': 0
    }
  },
  {
    selector: '.application-node',
    style: {
      'background-color': '#1d4ed8',
      'border-color': '#1e40af',
      color: '#ffffff',
      width: 240,
      height: 96,
      'text-outline-width': 2,
      'text-outline-color': '#1d4ed8',
      'shadow-blur': 10,
      'shadow-opacity': 0.22,
      'shadow-color': '#1d4ed8',
      'shadow-offset-x': 0,
      'shadow-offset-y': 2
    }
  },
  {
    selector: '.direct-dependency',
    style: {
      'background-color': '#dbeafe',
      'border-color': '#2563eb',
      'border-width': 1.5,
      color: '#0f172a'
    }
  },
  {
    selector: '.transitive-dependency',
    style: {
      'background-color': '#f8fafc',
      'border-color': '#94a3b8',
      color: '#172033',
      width: 215,
      height: 78
    }
  },
  {
    selector: '.expandable-node',
    style: {
      'border-style': 'dashed',
      'border-color': '#2563eb'
    }
  },
  {
    selector: '.selected-node',
    style: {
      'border-width': 3,
      'border-color': '#2563eb',
      'shadow-blur': 12,
      'shadow-opacity': 0.22,
      'shadow-color': '#2563eb',
      'shadow-offset-x': 0,
      'shadow-offset-y': 1
    }
  },
  {
    selector: '.search-hit',
    style: {
      'border-color': '#f59e0b',
      'border-width': 3,
      'background-color': '#fffbeb'
    }
  },
  {
    selector: 'edge',
    style: {
      width: 2.25,
      'line-color': '#64748b',
      'target-arrow-color': '#1d4ed8',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      label: 'data(label)',
      color: '#667085',
      'font-size': 12,
      'text-background-color': '#ffffff',
      'text-background-opacity': 1,
      'text-background-padding': '4px',
      'text-rotation': 'autorotate',
      'text-margin-y': -8
    }
  },
  {
    selector: '.dependency-edge',
    style: {
      'line-style': 'solid'
    }
  }
];

const layout = {
  name: 'dagre',
  rankDir: 'LR',
  nodeSep: 36,
  edgeSep: 18,
  rankSep: 90
};

export function DependencyGraph({
  graph,
  selectedNodeId,
  searchTerm,
  onSearchTermChange,
  onSelectNode,
  onToggleExpandNode
}: DependencyGraphProps) {
  const cyRef = useRef<Core | null>(null);

  const elements = useMemo<ElementDefinition[]>(
    () => getElements(graph, selectedNodeId, searchTerm),
    [graph, selectedNodeId, searchTerm]
  );

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    cy.layout(layout).run();
    cy.fit(undefined, 32);
  }, [elements]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    cy.on('tap', 'node', (event) => {
      onSelectNode(event.target.id());
    });

    cy.on('dbltap', 'node', (event) => {
      onToggleExpandNode(event.target.id());
    });

    return () => {
      cy.removeAllListeners();
    };
  }, [onSelectNode, onToggleExpandNode]);

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box>
          <Typography variant="h6">Dependency graph</Typography>
          <Typography variant="body2" color="text.secondary">
            Directed package relationships with initial depth limited to two levels.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          <Chip label={`${graph.visibleNodeIds.size} visible nodes`} variant="outlined" />
          <Chip label="Root" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', borderColor: '#1d4ed8' }} variant="outlined" />
          <Chip label="Direct" sx={{ bgcolor: '#bfdbfe', color: '#1e40af', borderColor: '#1e40af' }} variant="outlined" />
          <Chip label="Transitive" sx={{ bgcolor: '#f8fafc', color: '#475569', borderColor: '#94a3b8' }} variant="outlined" />
        </Stack>
      </Stack>

      <TextField
        label="Search packages"
        placeholder="Search by name, version, PURL, or bomRef"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        size="small"
      />

      <Box
        sx={{
          height: { xs: 540, lg: 640 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#f8fbff'
        }}
      >
        <CytoscapeComponent
          elements={elements}
          stylesheet={stylesheet}
          layout={layout}
          style={{ width: '100%', height: '100%', background: '#eef4ff' }}
          cy={(cy: Core) => {
            cyRef.current = cy;
            cy.layout(layout).run();
            cy.fit(undefined, 32);
          }}
          minZoom={0.25}
          maxZoom={1.5}
          wheelSensitivity={0.2}
        />
      </Box>
    </Stack>
  );
}

function getElements(
  graph: GraphModel,
  selectedNodeId: string | null,
  searchTerm: string
): ElementDefinition[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const elements: ElementDefinition[] = [];

  for (const [nodeId, node] of graph.nodesById.entries()) {
    elements.push({
      data: {
        id: nodeId,
        label: formatNodeLabel(node),
        ...node
      },
      classes: [
        node.isApplication
          ? 'application-node'
          : node.depth === 1
            ? 'direct-dependency'
            : 'transitive-dependency',
        node.hasHiddenChildren ? 'expandable-node' : '',
        selectedNodeId === nodeId ? 'selected-node' : '',
        normalizedSearch && node.searchText.includes(normalizedSearch) ? 'search-hit' : ''
      ]
        .filter(Boolean)
        .join(' ')
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

function formatNodeLabel(node: GraphNodeData): string {
  const version = node.version ? `v${escapePercent(node.version)}` : 'version unavailable';
  return `${escapePercent(node.name)}\n${version}`;
}
