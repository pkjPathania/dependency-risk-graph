import ELK from 'elkjs/lib/elk.bundled.js';
import type { ImpactFlowEdge, ImpactFlowNode } from './cveImpactFlowModel';

const elk = new ELK();

export const IMPACT_NODE_WIDTH = 220;
export const IMPACT_NODE_HEIGHT = 92;

export async function layoutImpactGraph(
  nodes: ImpactFlowNode[],
  edges: ImpactFlowEdge[]
): Promise<{ nodes: ImpactFlowNode[]; edges: ImpactFlowEdge[] }> {
  if (nodes.length === 0) return { nodes, edges };

  const result = await elk.layout({
    id: 'cve-impact-root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '45',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90',
      'elk.edgeRouting': 'ORTHOGONAL'
    },
    children: nodes.map((node) => ({ id: node.id, width: IMPACT_NODE_WIDTH, height: IMPACT_NODE_HEIGHT })),
    edges: edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] }))
  });
  const positions = new Map(result.children?.map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]) ?? []);
  return {
    nodes: nodes.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })),
    edges
  };
}
