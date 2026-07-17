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

export interface ApplicationSummary {
  iri: string | null;
  name: string | null;
  version: string | null;
}

export interface ApplicationOverview {
  directDependencyCount?: number | null;
  transitiveDependencyCount?: number | null;
  uniquePackageCount?: number | null;
  graphNodeCount?: number | null;
  graphEdgeCount?: number | null;
  vulnerablePackageCount?: number | null;
  criticalVulnerabilityCount?: number | null;
  lastEnrichedAt?: string | null;
}

export interface DependencySummary {
  iri: string;
  name: string;
  version?: string | null;
  purl?: string | null;
  direct?: boolean | null;
  depth?: number | null;
  outgoingDependencyCount?: number | null;
  incomingDependencyCount?: number | null;
  vulnerabilityCount?: number | null;
  highestSeverity?: string | null;
}

export interface SparqlSelectResponse {
  columns: string[];
  rows: Array<Record<string, string>>;
}

export interface DependencyPathNode {
  iri?: string | null;
  label?: string | null;
  version?: string | null;
  purl?: string | null;
  type?: string | null;
}

export interface DependencyPathResponse {
  found?: boolean | null;
  hops?: number | null;
  path?: DependencyPathNode[] | null;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details?: string[] | null;
  path?: string | null;
}
