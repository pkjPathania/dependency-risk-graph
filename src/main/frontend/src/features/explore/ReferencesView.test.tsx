import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type {
  AdvisoryReferenceItem,
  ApplicationReferencesResponse
} from '../../api/types';
import { ReferencesView } from './ReferencesView';

describe('ReferencesView', () => {
  it('renders loading and empty states', () => {
    const { rerender } = renderView({ loading: true });
    expect(screen.getByRole('progressbar', { name: 'Loading advisory references' })).toBeInTheDocument();

    rerender(<ReferencesView {...defaultProps} response={response([])} />);
    expect(screen.getByText('Advisory references will appear here after vulnerability enrichment.')).toBeInTheDocument();
  });

  it('renders one grouped accordion per advisory with preferred identifiers', () => {
    renderView({ response: response([item(), item({ vulnerabilityIri: 'urn:test:two', osvId: 'OSV-TWO', aliases: [] })]) });

    expect(screen.getByText('CVE-2026-3505')).toBeInTheDocument();
    expect(screen.getByText('GHSA-cj8j-37rh-8475')).toBeInTheDocument();
    expect(screen.getByText('OSV-TWO')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(2);
  });

  it('deduplicates repeated URLs and renders safe classified links', async () => {
    renderView({
      response: response([
        item({
          referenceUrls: [
            'https://nvd.nist.gov/vuln/detail/CVE-2026-3505',
            'https://nvd.nist.gov/vuln/detail/CVE-2026-3505',
            'https://github.com/example/project/commit/abc123'
          ]
        })
      ])
    });

    await userEvent.click(screen.getByRole('button', { name: /CVE-2026-3505/ }));

    const nvdLinks = screen.getAllByRole('link', {
      name: 'https://nvd.nist.gov/vuln/detail/CVE-2026-3505'
    });
    expect(nvdLinks).toHaveLength(1);
    expect(nvdLinks[0]).toHaveTextContent('NVD');
    expect(screen.getByRole('link', { name: 'https://github.com/example/project/commit/abc123' }))
      .toHaveTextContent('Fix commit');
    expect(nvdLinks[0]).toHaveAttribute('target', '_blank');
    expect(nvdLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows affected package versions distinctly', () => {
    renderView({ response: response([item()]) });

    expect(screen.getByText('bcpg-jdk18on 1.83')).toBeInTheDocument();
    expect(screen.getByText('bcpg-jdk18on 1.84')).toBeInTheDocument();
  });

  it('handles malformed reference URLs without crashing', async () => {
    renderView({ response: response([item({ referenceUrls: ['not a valid URL'] })]) });

    await userEvent.click(screen.getByRole('button', { name: /CVE-2026-3505/ }));

    expect(screen.getByRole('link', { name: 'not a valid URL' })).toBeInTheDocument();
  });

  it('filters by package name and CVE alias', async () => {
    renderView({
      response: response([
        item(),
        item({
          vulnerabilityIri: 'urn:test:jackson',
          osvId: 'GHSA-JACKSON',
          aliases: ['CVE-2026-54515'],
          affectedPackages: [
            { packageIri: 'urn:test:jackson-package', packageName: 'jackson-databind', installedVersion: '2.10.0' }
          ]
        })
      ])
    });
    const search = screen.getByLabelText('Search advisory references');

    await userEvent.type(search, 'jackson');
    expect(screen.getByText('CVE-2026-54515')).toBeInTheDocument();
    expect(screen.queryByText('CVE-2026-3505')).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'CVE-2026-3505');
    expect(screen.getByText('CVE-2026-3505')).toBeInTheDocument();
    expect(screen.queryByText('CVE-2026-54515')).not.toBeInTheDocument();
  });

  it('paginates grouped advisories rather than reference URLs', () => {
    const items = Array.from({ length: 26 }, (_, index) =>
      item({
        vulnerabilityIri: `urn:test:vulnerability:${index}`,
        osvId: `OSV-${String(index).padStart(2, '0')}`,
        aliases: [],
        referenceUrls: Array.from({ length: 12 }, (__, urlIndex) => `https://example.test/${index}/${urlIndex}`)
      })
    );
    renderView({ response: response(items) });

    expect(screen.getByText('OSV-00')).toBeInTheDocument();
    expect(screen.queryByText('OSV-25')).not.toBeInTheDocument();
    expect(screen.getByText('1–25 of 26')).toBeInTheDocument();
  });

  it('shows the filtered advisory count', async () => {
    renderView({
      response: response([
        item(),
        item({
          vulnerabilityIri: 'urn:test:jackson',
          osvId: 'GHSA-JACKSON',
          aliases: ['CVE-2026-54515'],
          affectedPackages: [
            { packageIri: 'urn:test:jackson-package', packageName: 'jackson-databind', installedVersion: '2.10.0' }
          ]
        })
      ])
    });

    expect(screen.getByText('2', { selector: '.MuiChip-label' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Search advisory references'), 'jackson');
    expect(screen.getByText('1', { selector: '.MuiChip-label' })).toBeInTheDocument();
  });
});

const defaultProps: ComponentProps<typeof ReferencesView> = {
  response: response([]),
  loading: false,
  error: null,
  onRefresh: vi.fn(),
  onOpenEnrichment: vi.fn()
};

function renderView(overrides: Partial<ComponentProps<typeof ReferencesView>> = {}) {
  return render(<ReferencesView {...defaultProps} {...overrides} />);
}

function response(items: AdvisoryReferenceItem[]): ApplicationReferencesResponse {
  return { applicationIri: 'urn:test:application', total: items.length, items };
}

function item(overrides: Partial<AdvisoryReferenceItem> = {}): AdvisoryReferenceItem {
  return {
    vulnerabilityIri: 'urn:test:vulnerability:one',
    osvId: 'GHSA-cj8j-37rh-8475',
    aliases: ['CVE-2026-3505'],
    summary: 'Bouncy Castle vulnerability',
    affectedPackages: [
      { packageIri: 'urn:test:bcpg:183', packageName: 'bcpg-jdk18on', installedVersion: '1.83' },
      { packageIri: 'urn:test:bcpg:184', packageName: 'bcpg-jdk18on', installedVersion: '1.84' }
    ],
    referenceUrls: [
      'https://nvd.nist.gov/vuln/detail/CVE-2026-3505',
      'https://github.com/example/project/commit/abc123'
    ],
    ...overrides
  };
}
