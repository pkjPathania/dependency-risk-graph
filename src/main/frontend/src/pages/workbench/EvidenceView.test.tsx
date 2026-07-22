import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EvidenceView } from './EvidenceView';

const apiMocks = vi.hoisted(() => ({
  rebuildAdvisoryEvidence: vi.fn(),
  searchAdvisoryEvidence: vi.fn()
}));

vi.mock('../../api/workbenchEvidence', () => apiMocks);

const longEvidence = `Vulnerability evidence for CVE-2026-54515.\n${'Detailed remediation evidence. '.repeat(40)}`;
const match = {
  id: 'GHSA-5jmj-h7xm-6q6v::remediation',
  vulnerabilityId: 'GHSA-5jmj-h7xm-6q6v',
  segmentType: 'REMEDIATION',
  score: 0.8840021003480774,
  text: longEvidence
};

const summary = 'Upgrade to a patched version listed in the matching remediation evidence.';

describe('EvidenceView', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    apiMocks.searchAdvisoryEvidence.mockReset();
    apiMocks.rebuildAdvisoryEvidence.mockReset();
    apiMocks.searchAdvisoryEvidence.mockImplementation(
      ({ query }: { query: string }) =>
        Promise.resolve({
          question: query,
          answer: summary,
          evidence: [match],
          finalSnitch: null,
          model: 'groq:llama-3.3-70b-versatile'
        })
    );
    apiMocks.rebuildAdvisoryEvidence.mockResolvedValue(undefined);
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
  });

  it('shows the initial state and lets suggestions populate the query without searching', async () => {
    const user = userEvent.setup();
    render(<EvidenceView />);

    expect(screen.getByRole('heading', { name: 'Advisory Evidence' })).toBeInTheDocument();
    expect(screen.getByText('Search advisory evidence')).toBeInTheDocument();
    expect(screen.queryByText('Graph Evidence')).not.toBeInTheDocument();

    await user.click(screen.getByText('Which versions fix CVE-2026-54515?'));
    expect(screen.getByLabelText('Evidence search query')).toHaveValue(
      'Which versions fix CVE-2026-54515?'
    );
    expect(apiMocks.searchAdvisoryEvidence).not.toHaveBeenCalled();
  });

  it('searches with configurable values and renders expandable, copyable result cards', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    render(<EvidenceView />);

    const queryInput = screen.getByLabelText('Evidence search query');
    await user.type(queryInput, 'Which versions fix CVE-2026-54515?');
    await user.clear(screen.getByLabelText('Max results'));
    await user.type(screen.getByLabelText('Max results'), '7');
    await user.clear(screen.getByLabelText('Minimum score'));
    await user.type(screen.getByLabelText('Minimum score'), '0.4');
    fireEvent.keyDown(queryInput, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(apiMocks.searchAdvisoryEvidence).toHaveBeenCalledWith({
        query: 'Which versions fix CVE-2026-54515?',
        maxResults: 7,
        minScore: 0.4
      });
    });

    expect(await screen.findByText('1 evidence match')).toBeInTheDocument();
    expect(screen.getByText('Buggy summary')).toBeInTheDocument();
    expect(screen.getByText(summary)).toBeInTheDocument();
    expect(screen.getByText('Global semantic discovery')).toBeInTheDocument();
    expect(
      screen.getByText(/Results are ranked by semantic similarity and may include related advisories/)
    ).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Exact identifier match')).toBeInTheDocument();
    expect(document.querySelector('mark')).toHaveTextContent('CVE-2026-54515');
    expect(screen.getByText('0.884')).toBeInTheDocument();
    expect(screen.getByText(match.id)).toBeInTheDocument();
    expect(screen.queryByText(longEvidence)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Show full evidence ${match.id}` }));
    expect(screen.getByRole('article').textContent).toContain(longEvidence);
    expect(screen.getByRole('button', { name: `Collapse ${match.id}` })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('button', { name: `Copy evidence ${match.id}` }));
    expect(writeText).toHaveBeenCalledWith(longEvidence);
    expect(await screen.findByText('Evidence copied')).toBeInTheDocument();
  });

  it('rebuilds without clearing the query or existing results', async () => {
    const user = userEvent.setup();
    render(<EvidenceView />);

    const queryInput = screen.getByLabelText('Evidence search query');
    await user.type(queryInput, 'Find remediation evidence');
    await user.click(screen.getByRole('button', { name: 'Search evidence' }));
    expect(await screen.findByText('1 evidence match')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Rebuild evidence index' }));

    await waitFor(() => expect(apiMocks.rebuildAdvisoryEvidence).toHaveBeenCalledOnce());
    expect(queryInput).toHaveValue('Find remediation evidence');
    expect(screen.getByText('1 evidence match')).toBeInTheDocument();
    expect(await screen.findByText('Evidence index rebuilt.')).toBeInTheDocument();
  });

  it('shows the dedicated no-results state after a successful empty search', async () => {
    const user = userEvent.setup();
    apiMocks.searchAdvisoryEvidence.mockResolvedValue({
      question: 'An unmatched advisory question',
      answer: "I couldn't find enough advisory evidence to answer that question.",
      evidence: [],
      finalSnitch: null,
      model: null
    });
    render(<EvidenceView />);

    await user.type(screen.getByLabelText('Evidence search query'), 'An unmatched advisory question');
    await user.click(screen.getByRole('button', { name: 'Search evidence' }));

    expect(await screen.findByText('No evidence matched')).toBeInTheDocument();
    expect(screen.getByText('🐞 Buggy found no receipts for that query.')).toBeInTheDocument();
  });
});
