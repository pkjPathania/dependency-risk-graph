import type { CvssAssessmentView } from '../../api/types';

export interface PresentedCvss {
  implementation: string;
  name: string;
  vector: string;
  severity: string;
  score: {
    base: number | null;
    impact: number | null;
    exploitability: number | null;
  };
  metrics: Array<[string, string]>;
}

export function presentCvss(assessment: CvssAssessmentView): PresentedCvss | null {
  const view = assessment as unknown as Record<string, unknown>;
  const candidate = objectValue(view.cvss) ?? objectValue(view.cvssAssessment) ?? view;
  const vector = stringValue(candidate.vector);
  if (!vector) {
    return null;
  }

  const score = objectValue(candidate.score);
  const baseScore = numberValue(score?.base) ?? numberValue(candidate.baseScore);
  const metrics = metricEntries(candidate);
  return {
    implementation: stringValue(candidate.implementation) ?? '',
    name:
      stringValue(candidate.name) ??
      (stringValue(candidate.version) ? `CVSS:${stringValue(candidate.version)}` : assessment.type ?? 'CVSS'),
    vector,
    severity:
      stringValue(candidate.severity) ??
      stringValue(candidate.severityRating) ??
      cvssSeverity(baseScore),
    score: {
      base: baseScore,
      impact: numberValue(score?.impact) ?? numberValue(candidate.impactScore),
      exploitability:
        numberValue(score?.exploitability) ?? numberValue(candidate.exploitabilityScore)
    },
    metrics
  };
}

export function cvssSeverity(score: number | null): string {
  if (score === null) return 'UNKNOWN';
  if (score === 0) return 'NONE';
  if (score < 4) return 'LOW';
  if (score < 7) return 'MEDIUM';
  if (score < 9) return 'HIGH';
  return 'CRITICAL';
}

export function highestCvssSeverity(assessments: CvssAssessmentView[]): string | null {
  const severities = assessments
    .map(presentCvss)
    .filter((cvss): cvss is PresentedCvss => cvss !== null)
    .map((cvss) => cvss.severity);
  return severities.sort((left, right) => severityRank(right) - severityRank(left))[0] ?? null;
}

export function displayScore(score: number | null): string {
  return score === null ? '—' : String(score);
}

export function cvssMetricName(code: string): string {
  return CVSS_METRIC_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

const CVSS_METRIC_NAMES: Record<string, string> = {
  AV: 'Attack Vector',
  AC: 'Attack Complexity',
  AT: 'Attack Requirements',
  AU: 'Automatable',
  PR: 'Privileges Required',
  UI: 'User Interaction',
  S: 'Scope / Safety',
  C: 'Confidentiality Impact',
  I: 'Integrity Impact',
  A: 'Availability Impact',
  VC: 'Vulnerable System Confidentiality',
  VI: 'Vulnerable System Integrity',
  VA: 'Vulnerable System Availability',
  SC: 'Subsequent System Confidentiality',
  SI: 'Subsequent System Integrity',
  SA: 'Subsequent System Availability',
  E: 'Exploit Maturity',
  RL: 'Remediation Level',
  RC: 'Report Confidence',
  CR: 'Confidentiality Requirement',
  IR: 'Integrity Requirement',
  AR: 'Availability Requirement',
  MAV: 'Modified Attack Vector',
  MAC: 'Modified Attack Complexity',
  MAT: 'Modified Attack Requirements',
  MPR: 'Modified Privileges Required',
  MUI: 'Modified User Interaction',
  MS: 'Modified Scope',
  MC: 'Modified Confidentiality Impact',
  MI: 'Modified Integrity Impact',
  MA: 'Modified Availability Impact',
  MVC: 'Modified Vulnerable Confidentiality',
  MVI: 'Modified Vulnerable Integrity',
  MVA: 'Modified Vulnerable Availability',
  MSC: 'Modified Subsequent Confidentiality',
  MSI: 'Modified Subsequent Integrity',
  MSA: 'Modified Subsequent Availability',
  R: 'Recovery',
  V: 'Value Density',
  RE: 'Vulnerability Response Effort',
  U: 'Provider Urgency'
};

function metricEntries(candidate: Record<string, unknown>): Array<[string, string]> {
  const nativeMetrics = Object.entries(candidate)
    .filter(([key, value]) =>
      !['implementation', 'name', 'version', 'vector', 'severity', 'score', 'baseScore', 'impactScore', 'exploitabilityScore', 'severityRating', 'metrics'].includes(key) &&
      typeof value === 'string'
    )
    .map(([key, value]) => [key.toUpperCase(), value as string] as [string, string]);
  if (nativeMetrics.length) {
    return nativeMetrics;
  }

  return Array.isArray(candidate.metrics)
    ? candidate.metrics.flatMap((metric) => {
        const value = objectValue(metric);
        const code = stringValue(value?.code);
        const metricValue = stringValue(value?.value);
        return code && metricValue ? [[code.toUpperCase(), metricValue] as [string, string]] : [];
      })
    : [];
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function severityRank(value: string): number {
  return ['UNKNOWN', 'NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].indexOf(value.toUpperCase());
}
