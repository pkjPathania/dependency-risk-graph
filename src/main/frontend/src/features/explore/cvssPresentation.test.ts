import { describe, expect, it } from 'vitest';
import type { CvssAssessmentView } from '../../api/types';
import { presentCvss } from './cvssPresentation';

describe('presentCvss', () => {
  it('normalizes the native cvss response', () => {
    const result = presentCvss({
      iri: 'urn:test:assessment',
      type: 'CVSS_V4',
      cvss: {
        implementation: 'CvssV4',
        name: 'CVSS:4.0',
        vector: 'CVSS:4.0/AV:L',
        severity: 'MEDIUM',
        score: { base: 4.8, impact: 2.1, exploitability: 2.0, temporal: 4.8, environmental: 4.8, modifiedImpact: 2.1 },
        av: 'LOCAL'
      }
    });

    expect(result?.name).toBe('CVSS:4.0');
    expect(result?.severity).toBe('MEDIUM');
    expect(result?.metrics).toContainEqual(['AV', 'LOCAL']);
  });

  it('normalizes the previous assessment response without throwing', () => {
    const legacy = {
      iri: 'urn:test:legacy',
      type: 'CVSS_V3',
      cvssAssessment: {
        version: '3.1',
        vector: 'CVSS:3.1/AV:N',
        baseScore: 9.8,
        impactScore: 5.9,
        exploitabilityScore: 3.9,
        metrics: [{ code: 'AV', value: 'NETWORK' }]
      }
    } as unknown as CvssAssessmentView;

    expect(presentCvss(legacy)).toMatchObject({
      name: 'CVSS:3.1',
      score: { base: 9.8, impact: 5.9, exploitability: 3.9 },
      metrics: [['AV', 'NETWORK']]
    });
  });

  it('returns null for an incomplete response', () => {
    expect(presentCvss({ iri: null, type: 'CVSS_V3' } as CvssAssessmentView)).toBeNull();
  });
});
