import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CveImpactDetailResponse, CveImpactListResponse } from '../../api/types';
import { fetchCveImpactDetail } from './exploreApi';
import { CveImpactView } from './CveImpactView';

vi.mock('./exploreApi', () => ({ fetchCveImpactDetail: vi.fn() }));
vi.mock('./CveImpactGraph', () => ({
  CveImpactGraph: ({ graph }: { graph: CveImpactDetailResponse['graph'] }) => (
    <div aria-label="CVE impact graph">
      {graph.nodes.map((node) => <span key={node.id}>{node.nodeType}:{node.label}</span>)}
    </div>
  )
}));

describe('CveImpactView', () => {
  beforeEach(() => {
    vi.mocked(fetchCveImpactDetail).mockResolvedValue(detailResponse());
  });

  it('renders one grouped row per vulnerability', () => {
    renderView();
    expect(screen.getAllByText('CVE-2026-1000')).toHaveLength(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2);
  });

  it('shows vulnerabilities affecting the most applications first', () => {
    renderView({ response: listResponse([
      listItem({ preferredIdentifier: 'CVE-2026-2000', vulnerabilityIri: 'urn:test:smaller', affectedApplicationCount: 1 }),
      listItem()
    ]) });

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('CVE-2026-1000');
    expect(rows[2]).toHaveTextContent('CVE-2026-2000');
  });

  it('opens the focused graph and renders the vulnerability once', async () => {
    renderView();
    await userEvent.click(screen.getByText('CVE-2026-1000'));
    await waitFor(() => expect(fetchCveImpactDetail).toHaveBeenCalledOnce());
    expect(screen.getByLabelText('CVE impact graph')).toBeInTheDocument();
    expect(screen.getAllByText('VULNERABILITY:CVE-2026-1000')).toHaveLength(1);
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders safe clickable references and tolerates malformed values', async () => {
    renderView();
    await userEvent.click(screen.getByText('CVE-2026-1000'));
    await screen.findByLabelText('CVE impact graph');
    await userEvent.click(screen.getByRole('tab', { name: 'References' }));
    const link = screen.getByRole('link', { name: 'https://nvd.nist.gov/vuln/detail/CVE-2026-1000' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('not a url')).toBeInTheDocument();
  });

  it('shows the enrichment action for an empty response', async () => {
    const onOpenEnrichment = vi.fn();
    renderView({ response: listResponse([]), onOpenEnrichment });
    await userEvent.click(screen.getByRole('button', { name: 'Open Vulnerability Enrichment' }));
    expect(onOpenEnrichment).toHaveBeenCalledOnce();
  });

  it('changes scope through the existing reload callback', async () => {
    const onScopeChange = vi.fn();
    renderView({ onScopeChange });
    await userEvent.click(screen.getByLabelText('Scope'));
    await userEvent.click(screen.getByRole('option', { name: 'All applications' }));
    expect(onScopeChange).toHaveBeenCalledWith('all');
  });
});

function renderView(overrides: Partial<ComponentProps<typeof CveImpactView>> = {}) {
  const props: ComponentProps<typeof CveImpactView> = {
    applicationIri: 'urn:test:application',
    scope: 'selected',
    response: listResponse([listItem()]),
    loading: false,
    error: null,
    onScopeChange: vi.fn(),
    onRefresh: vi.fn(),
    onOpenEnrichment: vi.fn(),
    ...overrides
  };
  return render(<CveImpactView {...props} />);
}

function listResponse(items: ReturnType<typeof listItem>[]): CveImpactListResponse {
  return { scope: 'selected', applicationIri: 'urn:test:application', total: items.length, items };
}

function listItem(overrides: Partial<CveImpactListResponse['items'][number]> = {}) {
  return {
    vulnerabilityIri: 'urn:test:vulnerability', preferredIdentifier: 'CVE-2026-1000', osvId: 'GHSA-IMPACT',
    aliases: ['CVE-2026-1000'], summary: 'Shared vulnerability', severityLevel: 'HIGH',
    affectedApplicationCount: 2, affectedPackageVersionCount: 2, referenceCount: 2,
    applicationNames: ['Orders', 'Analytics'], packageNames: ['jackson-databind'],
    ...overrides
  };
}

function detailResponse(): CveImpactDetailResponse {
  const vulnerability = {
    iri: 'urn:test:vulnerability', preferredIdentifier: 'CVE-2026-1000', osvId: 'GHSA-IMPACT', aliases: ['CVE-2026-1000'],
    summary: 'Shared vulnerability', details: 'Details', severityLevel: 'HIGH', publishedAt: null, modifiedAt: null,
    affectedApplicationCount: 2, affectedPackageVersionCount: 2
  };
  const exposures = ['Orders', 'Analytics'].map((name, index) => ({
    exposureId: `exposure-${index}`, application: { iri: `urn:test:app:${index}`, name, version: '1.0' },
    vulnerablePackage: { iri: `urn:test:package:${index}`, name: 'jackson-databind', version: `2.10.${index}`, purl: null },
    dependencyType: index ? 'TRANSITIVE' : 'DIRECT', dependencyHops: index + 1, pathStatus: 'AVAILABLE', path: [],
    pathNodeIds: [], pathEdgeIds: []
  }));
  return {
    vulnerability, exposures,
    fixedVersions: [{ iri: 'urn:test:fixed', packageName: 'jackson-databind', version: '2.10.5', purl: null }],
    cvssAssessments: [{ iri: 'urn:test:assessment', type: 'CVSS_V3', version: '3.1', vector: 'CVSS:3.1/AV:N' }],
    referenceUrls: ['https://nvd.nist.gov/vuln/detail/CVE-2026-1000', 'not a url'],
    graph: {
      nodes: [
        { id: vulnerability.iri, iri: vulnerability.iri, label: vulnerability.preferredIdentifier, version: null, nodeType: 'VULNERABILITY', metadata: {} },
        { id: 'urn:test:app:0', iri: 'urn:test:app:0', label: 'Orders', version: '1.0', nodeType: 'APPLICATION', metadata: {} },
        { id: 'urn:test:app:1', iri: 'urn:test:app:1', label: 'Analytics', version: '1.0', nodeType: 'APPLICATION', metadata: {} },
        { id: 'urn:test:fixed', iri: 'urn:test:fixed', label: 'jackson-databind', version: '2.10.5', nodeType: 'FIXED_VERSION', metadata: {} }
      ],
      edges: []
    }
  };
}
