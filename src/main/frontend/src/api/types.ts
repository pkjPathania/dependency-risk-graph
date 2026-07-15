export interface PackageComponent {
  bomRef: string;
  group: string | null;
  name: string;
  version: string | null;
  purl: string | null;
  type: string | null;
}

export interface DependencyEdge {
  sourceRef: string;
  targetRefs: string[];
}

export interface NormalizedSbom {
  applicationName: string;
  applicationVersion: string | null;
  components: PackageComponent[];
  dependencies: DependencyEdge[];
}

export interface GraphSummary {
  trippleCount: number;
  applicationCount: number;
  packageCount: number;
  dependencyEdgeCount: number;
}

export interface GraphMetadata {
  summary: GraphSummary;
  graph: {
    '@graph': Array<Record<string, unknown>>;
    '@context'?: Record<string, unknown>;
  };
}
