import { describe, expect, it } from 'vitest';
import type { AdvisoryEvidenceMatch } from '../../../api/workbenchEvidence';
import { extractVulnerabilityIdentifier, isExactIdentifierMatch } from './evidenceSearchUtils';

const baseMatch: AdvisoryEvidenceMatch = {
  id: 'GHSA-aaaa-bbbb-cccc::overview',
  vulnerabilityId: 'GHSA-aaaa-bbbb-cccc',
  segmentType: 'OVERVIEW',
  score: 0.8,
  text: 'Evidence for a related advisory.'
};

describe('evidenceSearchUtils', () => {
  it('extracts CVE and GHSA identifiers from natural-language queries', () => {
    expect(extractVulnerabilityIdentifier('Explain CVE-2026-54515 technically')).toBe(
      'CVE-2026-54515'
    );
    expect(extractVulnerabilityIdentifier('What fixes ghsa-5jmj-h7xm-6q6v?')).toBe(
      'ghsa-5jmj-h7xm-6q6v'
    );
    expect(extractVulnerabilityIdentifier('Find unsafe deserialization advisories')).toBeNull();
  });

  it('requires an exact textual identifier match in the vulnerability ID or evidence', () => {
    expect(isExactIdentifierMatch(baseMatch, 'GHSA-aaaa-bbbb-cccc')).toBe(true);
    expect(
      isExactIdentifierMatch(
        { ...baseMatch, vulnerabilityId: 'GHSA-related', text: 'Aliases include CVE-2026-54515.' },
        'CVE-2026-54515'
      )
    ).toBe(true);
    expect(
      isExactIdentifierMatch(
        { ...baseMatch, vulnerabilityId: 'CVE-2026-545150', text: 'A semantically related issue.' },
        'CVE-2026-54515'
      )
    ).toBe(false);
  });
});
