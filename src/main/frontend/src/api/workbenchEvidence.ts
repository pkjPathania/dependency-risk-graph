import { readApiErrorMessage } from './httpError';

const EVIDENCE_BASE_URL = '/api/workbench/evidence';

export type AdvisoryEvidenceSegmentType =
  | 'OVERVIEW'
  | 'TECHNICAL_DETAILS'
  | 'IMPACT'
  | 'REMEDIATION'
  | 'SEVERITY'
  | 'UPSTREAM_FIX'
  | (string & {});

export interface AdvisoryEvidenceSearchRequest {
  query: string;
  maxResults: number;
  minScore: number;
}

export interface AdvisoryEvidenceMatch {
  id: string;
  vulnerabilityId: string;
  segmentType: AdvisoryEvidenceSegmentType;
  score: number;
  text: string;
}

export async function searchAdvisoryEvidence(
  request: AdvisoryEvidenceSearchRequest
): Promise<AdvisoryEvidenceMatch[]> {
  const response = await fetch(`${EVIDENCE_BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Unable to search advisory evidence.'));
  }

  return (await response.json()) as AdvisoryEvidenceMatch[];
}

export async function rebuildAdvisoryEvidence(): Promise<void> {
  const response = await fetch(`${EVIDENCE_BASE_URL}/rebuild`, { method: 'POST' });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Unable to rebuild the evidence index.'));
  }
}
