import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSparqlStats } from './sparqlApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SPARQL API', () => {
  it('posts the query to the stats endpoint and returns all algebra views', async () => {
    const stats = {
      raw: '(project (?s) (bgp))',
      optimized: '(table unit)',
      rawSse: '(bgp)',
      optimizedSse: '(table unit)'
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSparqlStats('SELECT * WHERE { ?s ?p ?o }')).resolves.toEqual(stats);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sparql/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'SELECT * WHERE { ?s ?p ?o }'
    });
  });

  it('surfaces stats endpoint errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'The SPARQL query is invalid.' }), { status: 400 })
      )
    );

    await expect(fetchSparqlStats('not sparql')).rejects.toThrow(
      'The SPARQL query is invalid.'
    );
  });
});
