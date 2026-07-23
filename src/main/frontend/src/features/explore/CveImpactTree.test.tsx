import { describe, expect, it } from 'vitest';
import type { CveImpactDetailResponse } from '../../api/types';
import { buildSplitTreeLayout } from './CveImpactTree';

describe('CVE impact split tree layout', () => {
  it('centers the CVE with impacted applications left and fixes right', () => {
    const layout = buildSplitTreeLayout(detail);
    const center = layout.nodes.find((node) => node.datum.kind === 'cve');
    const application = layout.nodes.find((node) => node.datum.kind === 'application');
    const fix = layout.nodes.find((node) => node.datum.kind === 'fix');

    expect(center?.x).toBe(layout.width / 2);
    expect(application!.x).toBeLessThan(center!.x);
    expect(fix!.x).toBeGreaterThan(center!.x);
    expect(application!.x).toBeLessThan(50);
    expect(fix!.x).toBeGreaterThan(layout.width - 50);
  });

  it('places dependency path nodes between the application and CVE', () => {
    const layout = buildSplitTreeLayout(detail);
    const center = layout.nodes.find((node) => node.datum.kind === 'cve')!;
    const application = layout.nodes.find((node) => node.datum.kind === 'application')!;
    const dependency = layout.nodes.find((node) => node.datum.kind === 'dependency')!;
    const affectedPackage = layout.nodes.find((node) => node.datum.kind === 'package')!;

    expect(application.x).toBeLessThan(dependency.x);
    expect(dependency.x).toBeLessThan(affectedPackage.x);
    expect(affectedPackage.x).toBeLessThan(center.x);
    expect(layout.links.filter((link) => link.relationship === 'DEPENDS_ON')).not.toHaveLength(0);
    expect(layout.links.some((link) => link.relationship === 'AFFECTED_BY')).toBe(true);
    expect(layout.links.some((link) => link.relationship === 'FIXED_IN')).toBe(true);
  });

  it('merges repeated application, package, and fix identities', () => {
    const duplicateDetail: CveImpactDetailResponse = {
      ...detail,
      exposures: [
        detail.exposures[0],
        { ...detail.exposures[0], exposureId: 'exposure-two' }
      ],
      fixedVersions: [
        detail.fixedVersions[0],
        { ...detail.fixedVersions[0], iri: 'urn:test:fix:duplicate' }
      ]
    };

    const layout = buildSplitTreeLayout(duplicateDetail);

    expect(layout.nodes.filter((node) => node.datum.kind === 'cve')).toHaveLength(1);
    expect(layout.nodes.filter((node) => node.datum.kind === 'application')).toHaveLength(1);
    expect(layout.nodes.filter((node) => node.datum.kind === 'package')).toHaveLength(1);
    expect(layout.nodes.filter((node) => node.datum.kind === 'fix')).toHaveLength(1);
    expect(layout.links.filter((link) => link.relationship === 'FIXED_IN')).toHaveLength(1);
  });
});

const detail: CveImpactDetailResponse = {
  vulnerability: {
    iri: 'urn:test:cve',
    preferredIdentifier: 'CVE-2026-1000',
    osvId: 'GHSA-TEST',
    aliases: [],
    summary: null,
    details: null,
    severityLevel: 'HIGH',
    publishedAt: null,
    modifiedAt: null,
    affectedApplicationCount: 1,
    affectedPackageVersionCount: 1
  },
  exposures: [{
    exposureId: 'exposure-one',
    application: { iri: 'urn:test:app', name: 'Orders', version: '1.0' },
    vulnerablePackage: { iri: 'urn:test:package', name: 'library', version: '2.0', purl: null },
    dependencyType: 'TRANSITIVE',
    dependencyHops: 2,
    pathStatus: 'AVAILABLE',
    path: [
      { iri: 'urn:test:app', label: 'Orders', version: '1.0', purl: null, nodeType: 'APPLICATION' },
      { iri: 'urn:test:dependency', label: 'web', version: '1.2', purl: null, nodeType: 'DEPENDENCY' },
      { iri: 'urn:test:package', label: 'library', version: '2.0', purl: null, nodeType: 'VULNERABLE_PACKAGE' }
    ],
    pathNodeIds: [],
    pathEdgeIds: []
  }],
  fixedVersions: [{ iri: 'urn:test:fix', packageName: 'library', version: '2.1', purl: null }],
  cvssAssessments: [],
  referenceUrls: [],
  graph: { nodes: [], edges: [] }
};
