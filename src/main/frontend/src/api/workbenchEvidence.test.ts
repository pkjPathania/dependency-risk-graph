import { afterEach, describe, expect, it, vi } from 'vitest';
import { rebuildAdvisoryEvidence, searchAdvisoryEvidence } from './workbenchEvidence';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('workbenchEvidence API', () => {
  it('posts the configured semantic search request', async () => {
    const matches = [
      {
        id: 'GHSA-test::remediation',
        vulnerabilityId: 'GHSA-test',
        segmentType: 'REMEDIATION',
        score: 0.884,
        text: 'Complete evidence'
      }
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(matches), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = { query: 'Which version fixes it?', maxResults: 5, minScore: 0.55 };
    await expect(searchAdvisoryEvidence(request)).resolves.toEqual(matches);
    expect(fetchMock).toHaveBeenCalledWith('/api/workbench/evidence/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
  });

  it('posts rebuild without assuming a response body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(rebuildAdvisoryEvidence()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/workbench/evidence/rebuild', { method: 'POST' });
  });
});
