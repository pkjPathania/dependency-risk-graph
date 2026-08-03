import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SparqlQueryPage } from './SparqlQueryPage';

const apiMocks = vi.hoisted(() => ({
  executeSparqlQuery: vi.fn(),
  fetchSparqlStats: vi.fn(),
  formatSparqlQuery: vi.fn()
}));

vi.mock('../api/sparqlApi', () => apiMocks);

describe('SparqlQueryPage statistics', () => {
  beforeEach(() => {
    apiMocks.executeSparqlQuery.mockReset();
    apiMocks.fetchSparqlStats.mockReset();
    apiMocks.formatSparqlQuery.mockReset();
    apiMocks.fetchSparqlStats.mockResolvedValue({
      raw: '(bgp)',
      optimized: '(table unit)',
      rawSse: '(bgp)',
      optimizedSse: '(table unit)'
    });
  });

  it('loads stats for the editor query and opens the four-tab popup', async () => {
    const user = userEvent.setup();
    const query = 'SELECT * WHERE { ?s ?p ?o }';
    render(<SparqlQueryPage query={query} onQueryChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Query stats' }));

    await waitFor(() => expect(apiMocks.fetchSparqlStats).toHaveBeenCalledWith(query));
    expect(await screen.findByRole('dialog', { name: 'SPARQL query statistics' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
});
