import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImpactGraph } from '../../api/types';
import { CveImpactGraph } from './CveImpactGraph';

const flowMocks = vi.hoisted(() => ({
  props: null as null | {
    nodes: Array<{ id: string; position: { x: number; y: number } }>;
    edges: Array<{ id: string; label?: string }>;
    onNodesChange: (changes: unknown[]) => void;
  },
  fitView: vi.fn(),
  setCenter: vi.fn()
}));
const layoutMock = vi.hoisted(() => vi.fn());

vi.mock('./cveImpactElkLayout', () => ({
  layoutImpactGraph: layoutMock
}));

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  const React = await import('react');
  function useControlledState<T extends { id: string; position?: { x: number; y: number } }>(initial: T[]) {
    const [items, setItems] = React.useState(initial);
    const onChange = React.useCallback((changes: Array<{ id: string; type: string; position?: { x: number; y: number } }>) => {
      setItems((current) => current.map((item) => {
        const change = changes.find((candidate) => candidate.id === item.id && candidate.type === 'position');
        return change?.position ? { ...item, position: change.position } : item;
      }));
    }, []);
    return [items, setItems, onChange] as const;
  }
  return {
    ...actual,
    ReactFlowProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    ReactFlow: (props: typeof flowMocks.props & { children: ReactNode }) => {
      flowMocks.props = props;
      return <div data-testid="react-flow-canvas">
        {props?.nodes.map((node) => <span key={node.id}>{node.id}</span>)}
        {props?.edges.map((edge) => <span key={edge.id}>{edge.label}</span>)}
        <button onClick={() => props?.onNodesChange([{ id: props.nodes[0].id, type: 'position', position: { x: 999, y: 777 } }])}>Simulate node drag</button>
        {props?.children}
      </div>;
    },
    Background: () => null,
    Controls: () => <div aria-label="React Flow controls" />,
    MiniMap: () => <div aria-label="Graph minimap" />,
    Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Handle: () => <span />,
    BaseEdge: () => null,
    EdgeLabelRenderer: ({ children }: { children: ReactNode }) => <>{children}</>,
    useNodesState: useControlledState,
    useEdgesState: useControlledState,
    useReactFlow: () => ({ fitView: flowMocks.fitView, setCenter: flowMocks.setCenter }),
    getSmoothStepPath: () => ['', 0, 0]
  };
});

describe('CveImpactGraph interactions', () => {
  beforeEach(() => {
    flowMocks.props = null;
    flowMocks.fitView.mockReset();
    flowMocks.setCenter.mockReset();
    layoutMock.mockReset().mockImplementation(async (nodes, edges) => ({
      nodes: nodes.map((node: { position: { x: number; y: number } }, index: number) => ({ ...node, position: { x: index * 100, y: index * 50 } })),
      edges
    }));
  });

  it('updates a dragged node immediately without rerunning layout', async () => {
    renderGraph();
    await waitFor(() => expect(flowMocks.props?.nodes.length).toBeGreaterThan(0));
    expect(layoutMock).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Simulate node drag' }));

    await waitFor(() => expect(flowMocks.props?.nodes[0].position).toEqual({ x: 999, y: 777 }));
    expect(layoutMock).toHaveBeenCalledTimes(1);
  });

  it('provides fit view and explicitly resets the ELK layout', async () => {
    renderGraph();
    await waitFor(() => expect(layoutMock).toHaveBeenCalledTimes(1));
    flowMocks.fitView.mockClear();

    await userEvent.click(screen.getByRole('button', { name: 'Fit view' }));
    expect(flowMocks.fitView).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Reset layout' }));
    await waitFor(() => expect(layoutMock).toHaveBeenCalledTimes(2));
  });

  it('defaults to simplified mode and exposes exact INSTANCE_OF edges in detailed RDF mode', async () => {
    renderGraph();
    await waitFor(() => expect(flowMocks.props?.nodes.length).toBeGreaterThan(0));
    expect(flowMocks.props?.edges.some((edge) => edge.label === 'INSTANCE_OF')).toBe(false);
    expect(flowMocks.props?.edges.some((edge) => edge.label === 'AFFECTED_BY')).toBe(true);
    expect(flowMocks.props?.edges.some((edge) => edge.label === 'FIXED_IN')).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Detailed RDF' }));
    await waitFor(() => expect(flowMocks.props?.edges.some((edge) => edge.label === 'INSTANCE_OF')).toBe(true));
  });
});

function renderGraph() {
  return render(<CveImpactGraph graph={graph} selectedExposureId={null} onSelectExposure={vi.fn()} onSelectNode={vi.fn()} />);
}

const application = 'urn:test:application-occurrence';
const occurrence = 'urn:test:package-occurrence';
const packageVersion = 'urn:test:package-version';
const vulnerability = 'urn:test:vulnerability';
const fixedVersion = 'urn:test:fixed-version';
const graph: ImpactGraph = {
  nodes: [
    node(application, 'Orders', 'APPLICATION'),
    node(occurrence, 'library occurrence', 'DEPENDENCY'),
    node(packageVersion, 'library', 'VULNERABLE_PACKAGE'),
    node(vulnerability, 'CVE-2026-1000', 'VULNERABILITY'),
    node(fixedVersion, 'library', 'FIXED_VERSION')
  ],
  edges: [
    edge(application, 'DEPENDS_ON', occurrence),
    edge(occurrence, 'INSTANCE_OF', packageVersion),
    edge(packageVersion, 'AFFECTED_BY', vulnerability),
    edge(vulnerability, 'FIXED_IN', fixedVersion)
  ]
};

function node(id: string, label: string, nodeType: ImpactGraph['nodes'][number]['nodeType']): ImpactGraph['nodes'][number] {
  return { id, iri: id, label, version: null, nodeType, metadata: {} };
}

function edge(source: string, relationship: ImpactGraph['edges'][number]['relationship'], target: string): ImpactGraph['edges'][number] {
  return { id: `${source}\u0000${relationship}\u0000${target}`, source, relationship, target, exposureIds: ['exposure-one'] };
}
