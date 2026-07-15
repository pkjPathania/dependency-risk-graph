import type { Severity } from '../../types/severity';

export interface DependencyRiskEvidence {
  source: string;
  title?: string;
  url?: string;
}

export interface DependencyRiskRemediation {
  package: string;
  currentVersion: string | null;
  fixedVersion: string | null;
}

export interface DependencyRiskAnswer {
  answerType: 'DEPENDENCY_RISK';
  summary: string;
  severity: Severity;
  dependencyPaths: string[][];
  remediations: DependencyRiskRemediation[];
  evidence: DependencyRiskEvidence[];
}

export type AssistantAnswer = DependencyRiskAnswer | { answerType: 'GENERAL'; summary: string };
