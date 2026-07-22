import type { AdvisoryEvidenceMatch } from '../../../api/workbenchEvidence';

const CVE_PATTERN = /\bCVE-\d{4}-\d{4,}\b/i;
const GHSA_PATTERN = /\bGHSA-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}\b/i;

export function extractVulnerabilityIdentifier(query: string): string | null {
  return query.match(CVE_PATTERN)?.[0] ?? query.match(GHSA_PATTERN)?.[0] ?? null;
}

export function isExactIdentifierMatch(
  result: AdvisoryEvidenceMatch,
  identifier: string | null
): boolean {
  if (!identifier) {
    return false;
  }

  const pattern = identifierPattern(identifier);
  return pattern.test(result.vulnerabilityId) || pattern.test(result.text);
}

export function identifierPattern(identifier: string): RegExp {
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}
