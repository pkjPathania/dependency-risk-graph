import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type {
  ApplicationVulnerabilitiesResponse,
  ApplicationVulnerabilityItem
} from '../../api/types';
import { VulnerabilitiesView } from './VulnerabilitiesView';

describe('VulnerabilitiesView', () => {
  it('renders the loading state', () => {
    renderView({ loading: true });

    expect(screen.getByRole('progressbar', { name: 'Loading vulnerabilities' })).toBeInTheDocument();
  });

  it('renders the enrichment prompt and opens Vulnerability Enrichment', async () => {
    const onOpenEnrichment = vi.fn();
    renderView({ response: response([]), onOpenEnrichment });

    expect(screen.getByText('Run OSV enrichment to populate vulnerability data.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open Vulnerability Enrichment' }));
    expect(onOpenEnrichment).toHaveBeenCalledOnce();
  });

  it('falls back to calculated CVSS severity when advisory severity is absent', () => {
    renderView({ response: response([item()]) });

    expect(screen.getByText('jackson-databind')).toBeInTheDocument();
    expect(screen.getByText('CVE-2026-54515')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('renders multiple fixed versions distinctly', () => {
    renderView({ response: response([item()]) });

    expect(screen.getByText('2.18.9')).toBeInTheDocument();
    expect(screen.getByText('2.21.5')).toBeInTheDocument();
  });

  it('renders the calculated CVSS score and severity', () => {
    renderView({ response: response([item()]) });

    expect(screen.getByText('CVSS:3.1 · 9.8 CRITICAL')).toBeInTheDocument();
  });

  it('filters by CVE alias', async () => {
    renderView({
      response: response([
        item(),
        item({
          packageIri: 'urn:test:bcprov',
          packageName: 'bcprov-jdk15on',
          vulnerabilityIri: 'urn:test:osv:two',
          osvId: 'GHSA-OTHER',
          aliases: ['CVE-2020-15522']
        })
      ])
    });

    await userEvent.type(screen.getByLabelText('Search vulnerabilities'), 'CVE-2020-15522');
    expect(screen.getByText('bcprov-jdk15on')).toBeInTheDocument();
    expect(screen.queryByText('jackson-databind')).not.toBeInTheDocument();
  });

  it('filters by package name', async () => {
    renderView({
      response: response([
        item(),
        item({
          packageIri: 'urn:test:bcprov',
          packageName: 'bcprov-jdk15on',
          vulnerabilityIri: 'urn:test:osv:two',
          osvId: 'GHSA-OTHER',
          aliases: ['CVE-2020-15522']
        })
      ])
    });

    await userEvent.type(screen.getByLabelText('Search vulnerabilities'), 'jackson');
    expect(screen.getByText('jackson-databind')).toBeInTheDocument();
    expect(screen.queryByText('bcprov-jdk15on')).not.toBeInTheDocument();
  });

  it('shows the filtered vulnerability count', async () => {
    renderView({
      response: response([
        item(),
        item({
          packageIri: 'urn:test:bcprov',
          packageName: 'bcprov-jdk15on',
          vulnerabilityIri: 'urn:test:osv:two',
          osvId: 'GHSA-OTHER'
        })
      ])
    });

    expect(screen.getByText('2', { selector: '.MuiChip-label' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Search vulnerabilities'), 'jackson');
    expect(screen.getByText('1', { selector: '.MuiChip-label' })).toBeInTheDocument();
  });
});

function renderView(overrides: Partial<ComponentProps<typeof VulnerabilitiesView>> = {}) {
  const props: ComponentProps<typeof VulnerabilitiesView> = {
    response: response([]),
    loading: false,
    error: null,
    onRefresh: vi.fn(),
    onOpenEnrichment: vi.fn(),
    ...overrides
  };
  return render(<VulnerabilitiesView {...props} />);
}

function response(items: ApplicationVulnerabilityItem[]): ApplicationVulnerabilitiesResponse {
  return { applicationIri: 'urn:test:application', total: items.length, items };
}

function item(overrides: Partial<ApplicationVulnerabilityItem> = {}): ApplicationVulnerabilityItem {
  return {
    packageIri: 'urn:test:jackson',
    packageName: 'jackson-databind',
    installedVersion: '2.10.0',
    installedPurl: 'pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.10.0',
    dependencyType: 'TRANSITIVE',
    vulnerabilityIri: 'urn:test:osv:one',
    osvId: 'GHSA-5jmj-h7xm-6q6v',
    aliases: ['CVE-2026-54515'],
    summary: 'Example vulnerability',
    details: 'Details',
    severityLevel: null,
    publishedAt: '2026-07-18T00:00:00Z',
    modifiedAt: '2026-07-18T01:00:00Z',
    cvssAssessments: [
      {
        iri: 'urn:test:assessment',
        type: 'CVSS_V3',
        cvss: {
          implementation: 'CvssV3_1',
          name: 'CVSS:3.1',
          vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          severity: 'CRITICAL',
          score: { base: 9.8, impact: 5.9, exploitability: 3.9, temporal: 9.8, environmental: 9.8, modifiedImpact: 5.9 },
          av: 'NETWORK'
        }
      }
    ],
    fixedVersions: [
      { iri: 'urn:test:fixed:2189', packageName: 'jackson-databind', version: '2.18.9', purl: 'pkg:maven/jackson@2.18.9' },
      { iri: 'urn:test:fixed:2215', packageName: 'jackson-databind', version: '2.21.5', purl: 'pkg:maven/jackson@2.21.5' }
    ],
    referenceUrls: ['https://example.test/advisory'],
    ...overrides
  };
}
