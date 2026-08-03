import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SparqlStatsDialog } from './SparqlStatsDialog';

const stats = {
  raw: '(project (?s) (bgp))',
  optimized: '(table unit)',
  rawSse: '(project (?s) (bgp (triple ?s ?p ?o)))',
  optimizedSse: '(table unit)'
};

describe('SparqlStatsDialog', () => {
  it('shows the four requested views and switches their content', async () => {
    const user = userEvent.setup();
    render(
      <SparqlStatsDialog open loading={false} stats={stats} onClose={vi.fn()} />
    );

    expect(screen.getByRole('tab', { name: 'Op raw' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Op optimized' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'String rawSse' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'String optimizedSse' })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('(project (?s) (bgp))');

    await user.click(screen.getByRole('tab', { name: 'String optimizedSse' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent('(table unit)');
  });
});
