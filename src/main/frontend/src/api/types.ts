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
  vulnerablePackages: number;
  criticalVulnerabilities: number;
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

export interface CvssAssessmentView {
  type: string | null;
  version: string | null;
  vector: string;
}

export interface FixedVersionView {
  packageName: string | null;
  version: string;
  purl: string | null;
}

export interface ApplicationVulnerabilityItem {
  packageIri: string;
  packageName: string;
  installedVersion: string | null;
  installedPurl: string | null;
  dependencyType: string;
  vulnerabilityIri: string;
  osvId: string;
  aliases: string[];
  summary: string | null;
  details: string | null;
  severityLevel: string | null;
  publishedAt: string | null;
  modifiedAt: string | null;
  cvssAssessments: CvssAssessmentView[];
  fixedVersions: FixedVersionView[];
  referenceUrls: string[];
}

export interface ApplicationVulnerabilitiesResponse {
  applicationIri: string;
  total: number;
  items: ApplicationVulnerabilityItem[];
}

export interface AffectedPackageReference {
  packageIri: string;
  packageName: string;
  installedVersion: string;
}

export interface AdvisoryReferenceItem {
  vulnerabilityIri: string;
  osvId: string;
  aliases: string[];
  summary: string | null;
  affectedPackages: AffectedPackageReference[];
  referenceUrls: string[];
}

export interface ApplicationReferencesResponse {
  applicationIri: string;
  total: number;
  items: AdvisoryReferenceItem[];
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

export interface ApplicationVulnerabilityScanRequest {
  applicationIri: string;
}

export interface ApplicationVulnerabilityRow {
  packageIri: string;
  packageName: string;
  packageVersion: string;
  purl: string;
  osvId: string;
  displayId: string;
  summary: string;
  aliases: string[];
  severity: string;
  severityType: string;
  severityScore: string;
  fixedVersions: string[];
  publishedAt: string | null;
  modifiedAt: string | null;
  withdrawnAt: string | null;
}

export interface ApplicationVulnerabilityScanResponse {
  applicationIri: string;
  applicationName: string;
  applicationVersion: string | null;
  scannedAt: string;
  packagesDiscovered: number;
  packagesQueried: number;
  packagesSkipped: number;
  vulnerablePackages: number;
  uniqueVulnerabilities: number;
  failedPackages: number;
  advisoryFetchFailures: number;
  durationMs: number;
  findings: ApplicationVulnerabilityRow[];
}
