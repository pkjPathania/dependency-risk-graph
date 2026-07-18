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

export interface SbomImportResult {
  importId: string;
  activeImportId: string;
  importRunIri: string;
  rootOccurrenceIri: string;
  productName: string | null;
  productVersion: string | null;
  specificationVersion: string;
  componentCount: number;
  dependencyEdgeCount: number;
  graphQuality: string;
  issues: Array<{ severity: string; code: string; message: string }>;
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
  iri: string | null;
  type: string | null;
  version: string | null;
  vector: string;
}

export interface FixedVersionView {
  iri: string | null;
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

export type CveImpactScope = 'selected' | 'all';

export interface CveImpactListItem {
  vulnerabilityIri: string;
  preferredIdentifier: string;
  osvId: string;
  aliases: string[];
  summary: string | null;
  severityLevel: string | null;
  affectedApplicationCount: number;
  affectedPackageVersionCount: number;
  referenceCount: number;
  applicationNames: string[];
  packageNames: string[];
}

export interface CveImpactListResponse {
  scope: CveImpactScope;
  applicationIri: string | null;
  total: number;
  items: CveImpactListItem[];
}

export interface VulnerabilityDetail {
  iri: string;
  preferredIdentifier: string;
  osvId: string;
  aliases: string[];
  summary: string | null;
  details: string | null;
  severityLevel: string | null;
  publishedAt: string | null;
  modifiedAt: string | null;
  affectedApplicationCount: number;
  affectedPackageVersionCount: number;
}

export interface ApplicationView {
  iri: string;
  name: string;
  version: string | null;
}

export interface PackageVersionView {
  iri: string;
  name: string;
  version: string | null;
  purl: string | null;
}

export interface PathNodeView {
  iri: string;
  label: string | null;
  version: string | null;
  purl: string | null;
  nodeType: string;
}

export interface ExposurePath {
  exposureId: string;
  application: ApplicationView;
  vulnerablePackage: PackageVersionView;
  dependencyType: string;
  dependencyHops: number;
  pathStatus: string;
  path: PathNodeView[];
  pathNodeIds: string[];
  pathEdgeIds: string[];
}

export interface ImpactGraphNode {
  id: string;
  iri: string;
  label: string | null;
  version: string | null;
  nodeType: 'APPLICATION' | 'DEPENDENCY' | 'VULNERABLE_PACKAGE' | 'VULNERABILITY' | 'FIXED_VERSION';
  metadata: Record<string, unknown>;
}

export interface ImpactGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'DEPENDS_ON' | 'INSTANCE_OF' | 'AFFECTED_BY' | 'FIXED_IN';
  exposureIds: string[];
}

export interface ImpactGraph {
  nodes: ImpactGraphNode[];
  edges: ImpactGraphEdge[];
}

export interface CveImpactDetailResponse {
  vulnerability: VulnerabilityDetail;
  exposures: ExposurePath[];
  fixedVersions: FixedVersionView[];
  cvssAssessments: CvssAssessmentView[];
  referenceUrls: string[];
  graph: ImpactGraph;
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
  importId?: string;
}

export type VulnerabilityScanStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED';

export interface OsvFailedPackage {
  purl: string;
  batchNumber: number;
  code: string;
  message: string;
  retryable: boolean;
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
  importId: string;
  activeImportId: string;
  rootOccurrenceIri: string;
  status: VulnerabilityScanStatus;
  applicationName: string;
  applicationVersion: string | null;
  scannedAt: string;
  packagesDiscovered: number;
  packagesQueried: number;
  packagesSkipped: number;
  successfulPackages: number;
  vulnerablePackages: number;
  uniqueVulnerabilities: number;
  failedPackages: number;
  advisoryFetchFailures: number;
  failedBatchNumbers: number[];
  failures: OsvFailedPackage[];
  warnings: string[];
  durationMs: number;
  findings: ApplicationVulnerabilityRow[];
}
