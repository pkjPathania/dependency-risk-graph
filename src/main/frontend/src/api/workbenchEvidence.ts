import { readApiErrorMessage } from './httpError';

const EVIDENCE_REBUILD_URL = '/api/workbench/evidence/rebuild';
const ASSISTANT_EVIDENCE_URL = '/api/workbench/assistant/evidence';

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

export interface BuggyEvidenceResponse {
  question: string;
  answer: string;
  evidence: AdvisoryEvidenceMatch[];
  finalSnitch: string | null;
  model: string | null;
}

export async function searchAdvisoryEvidence(
  request: AdvisoryEvidenceSearchRequest
): Promise<BuggyEvidenceResponse> {
  const response = await fetch(ASSISTANT_EVIDENCE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: request.query,
      maxResults: request.maxResults,
      minScore: request.minScore
    })
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Unable to search advisory evidence.'));
  }

  return (await response.json()) as BuggyEvidenceResponse;
}

export async function rebuildAdvisoryEvidence(): Promise<void> {
  const response = await fetch(EVIDENCE_REBUILD_URL, { method: 'POST' });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Unable to rebuild the evidence index.'));
  }
}
