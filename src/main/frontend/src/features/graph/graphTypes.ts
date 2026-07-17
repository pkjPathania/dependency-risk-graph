import type { Theme } from '@mui/material/styles';
import type { LinkObject, NodeObject } from '3d-force-graph';
import type { GraphNodeData } from './graphMapper';

export type GraphLayoutMode = 'force' | 'radial' | 'flow';

export type GraphScale = 'small' | 'medium' | 'large' | 'very-large';

export type GraphColorMode = 'semantic' | 'depth';

export type DependencyLinkPredicate = 'DEPENDS_ON' | 'AFFECTED_BY' | 'FIXED_IN';

export type DependencyGraphNodeKind =
  | 'application'
  | 'vulnerability'
  | 'vulnerable-package'
  | 'fixed-package-version'
  | 'unresolved'
  | 'package-version'
  | 'package';

export interface DependencyGraphNode extends NodeObject, GraphNodeData {
  id: string;
  label: string;
  kind: DependencyGraphNodeKind;
  val: number;
  color: string;
  opacity: number;
}

export interface DependencyGraphLink extends LinkObject<DependencyGraphNode> {
  id: string;
  source: string;
  target: string;
  predicate: DependencyLinkPredicate;
  color: string;
  opacity: number;
}

export interface GraphVisualConfig {
  densityMultiplier: number;
  nodeResolution: number;
  linkOpacity: number;
  linkWidth: number;
  arrowLength: number;
  warmupTicks: number;
  cooldownTicks: number;
  levelDistance: number;
  nodeOpacity: number;
  highlightNodeBoost: number;
  highlightLinkWidthBoost: number;
  labelBoost: number;
}

export interface GraphRenderState {
  theme: Theme;
  scale: GraphScale;
  config: GraphVisualConfig;
  graphBackground: string;
  colorMode: GraphColorMode;
  showPersistentLabels: boolean;
  highlightedNodeIds: Set<string>;
  highlightedLinkIds: Set<string>;
  degreeByNodeId: Map<string, number>;
  selectedNodeId: string | null;
  searchTerm: string;
}
