import { Alert, Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type {
  ApplicationOverview as ApplicationOverviewModel,
  ApplicationReferencesResponse,
  ApplicationSummary,
  ApplicationVulnerabilityItem,
  ApplicationVulnerabilitiesResponse,
  CveImpactListResponse,
  DependencySummary
} from '../api/types';
import { RestCallProgress } from '../components/RestCallProgress';
import { ApplicationMultiSelector } from '../features/explore/ApplicationMultiSelector';
import { ApplicationOverview } from '../features/explore/ApplicationOverview';
import { DependenciesView } from '../features/explore/DependenciesView';
import { CveImpactView } from '../features/explore/CveImpactView';
import {
  fetchApplicationDependencies,
  fetchApplicationOverview,
  fetchApplicationReferences,
  fetchApplicationSummaries,
  fetchApplicationVulnerabilities,
  fetchCveImpactList
} from '../features/explore/exploreApi';
import type { ExploreTab } from '../features/explore/exploreTypes';
import { ExploreTabs } from '../features/explore/ExploreTabs';
import { ReferencesView } from '../features/explore/ReferencesView';
import { VulnerabilitiesView } from '../features/explore/VulnerabilitiesView';

interface ExplorerPageProps {
  initialApplicationIri?: string | null;
  onOpenVulnerabilityEnrichment: (applicationIri: string) => void;
}

export function ExplorerPage({ initialApplicationIri, onOpenVulnerabilityEnrichment }: ExplorerPageProps) {
  const [summaries, setSummaries] = useState<ApplicationSummary[]>([]);
  const [selectedApplicationIris, setSelectedApplicationIris] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ExploreTab>('overview');
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchApplicationOverview>> | null>(null);
  const [dependencies, setDependencies] = useState<Awaited<ReturnType<typeof fetchApplicationDependencies>>>([]);
  const [vulnerabilities, setVulnerabilities] = useState<ApplicationVulnerabilitiesResponse | null>(null);
  const [vulnerabilitiesLoading, setVulnerabilitiesLoading] = useState(false);
  const [vulnerabilitiesError, setVulnerabilitiesError] = useState<string | null>(null);
  const [vulnerabilitiesReloadCounter, setVulnerabilitiesReloadCounter] = useState(0);
  const [references, setReferences] = useState<ApplicationReferencesResponse | null>(null);
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [referencesError, setReferencesError] = useState<string | null>(null);
  const [referencesReloadCounter, setReferencesReloadCounter] = useState(0);
  const [cveImpact, setCveImpact] = useState<CveImpactListResponse | null>(null);
  const [cveImpactLoading, setCveImpactLoading] = useState(false);
  const [cveImpactError, setCveImpactError] = useState<string | null>(null);
  const [cveImpactReloadCounter, setCveImpactReloadCounter] = useState(0);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [summariesError, setSummariesError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const selectableSummaries = summaries.filter(
    (summary): summary is ApplicationSummary & { iri: string } => Boolean(summary.iri?.trim())
  );
  const selectionKey = selectedApplicationIris.join('\u0000');

  useEffect(() => {
    let active = true;

    async function loadSummaries() {
      setSummariesLoading(true);
      setSummariesError(null);

      try {
        const nextSummaries = await fetchApplicationSummaries();
        if (!active) {
          return;
        }

        setSummaries(nextSummaries);
        setSelectedApplicationIris((current) => preserveSelection(current, nextSummaries, initialApplicationIri));
      } catch (error) {
        if (!active) {
          return;
        }

        console.error('Failed to load application summaries.', error);
        setSummaries([]);
        setSelectedApplicationIris([]);
        setSummariesError('Unable to load applications.');
      } finally {
        if (active) {
          setSummariesLoading(false);
        }
      }
    }

    void loadSummaries();

    return () => {
      active = false;
    };
  }, [initialApplicationIri]);

  useEffect(() => {
    let active = true;
    const applicationIris = selectedApplicationIris;

    if (applicationIris.length === 0) {
      setOverview(null);
      setDependencies([]);
      setWorkspaceError(null);
      setWorkspaceLoading(false);
      return () => {
        active = false;
      };
    }

    setOverview(null);
    setDependencies([]);
    setWorkspaceError(null);
    setWorkspaceLoading(true);

    async function loadWorkspace() {
      try {
        const workspaces = await Promise.all(applicationIris.map(async (applicationIri) => {
          const [nextOverview, nextDependencies] = await Promise.all([
            fetchApplicationOverview(applicationIri),
            fetchApplicationDependencies(applicationIri)
          ]);
          return { overview: nextOverview, dependencies: nextDependencies };
        }));
        if (!active) {
          return;
        }

        const nextDependencies = mergeDependencies(workspaces.flatMap(({ dependencies }) => dependencies));
        setOverview(mergeOverviews(workspaces.map(({ overview }) => overview), nextDependencies));
        setDependencies(nextDependencies);
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(`Failed to load application workspace for ${applicationIris.join(', ')}.`, error);
        setOverview(null);
        setDependencies([]);
        setWorkspaceError('Unable to load application summary.');
      } finally {
        if (active) {
          setWorkspaceLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, [reloadCounter, selectionKey]);

  useEffect(() => {
    setVulnerabilities(null);
    setVulnerabilitiesError(null);
  }, [selectionKey]);

  useEffect(() => {
    let active = true;
    const applicationIris = selectedApplicationIris;
    if (activeTab !== 'vulnerabilities' || applicationIris.length === 0) {
      return () => {
        active = false;
      };
    }

    setVulnerabilitiesLoading(true);
    setVulnerabilitiesError(null);

    async function loadVulnerabilities() {
      try {
        const responses = await Promise.all(applicationIris.map(fetchApplicationVulnerabilities));
        if (active) {
          setVulnerabilities(mergeVulnerabilityResponses(applicationIris, responses));
        }
      } catch (error) {
        if (active) {
          console.error(`Failed to load vulnerabilities for ${applicationIris.join(', ')}.`, error);
          setVulnerabilities(null);
          setVulnerabilitiesError(
            error instanceof Error ? error.message : 'Unable to load application vulnerabilities.'
          );
        }
      } finally {
        if (active) {
          setVulnerabilitiesLoading(false);
        }
      }
    }

    void loadVulnerabilities();
    return () => {
      active = false;
    };
  }, [activeTab, selectionKey, vulnerabilitiesReloadCounter]);

  useEffect(() => {
    setReferences(null);
    setReferencesError(null);
  }, [selectionKey]);

  useEffect(() => {
    let active = true;
    const applicationIris = selectedApplicationIris;
    if (activeTab !== 'references' || applicationIris.length === 0) {
      return () => {
        active = false;
      };
    }

    setReferencesLoading(true);
    setReferencesError(null);

    async function loadReferences() {
      try {
        const responses = await Promise.all(applicationIris.map(fetchApplicationReferences));
        if (active) {
          setReferences(mergeReferenceResponses(applicationIris, responses));
        }
      } catch (error) {
        if (active) {
          console.error(`Failed to load advisory references for ${applicationIris.join(', ')}.`, error);
          setReferences(null);
          setReferencesError('Unable to load advisory references.');
        }
      } finally {
        if (active) {
          setReferencesLoading(false);
        }
      }
    }

    void loadReferences();
    return () => {
      active = false;
    };
  }, [activeTab, referencesReloadCounter, selectionKey]);

  useEffect(() => {
    setCveImpact(null);
    setCveImpactError(null);
  }, [selectionKey]);

  useEffect(() => {
    let active = true;
    const applicationIris = selectedApplicationIris;
    if (activeTab !== 'cve-impact' || applicationIris.length === 0) {
      setCveImpactLoading(false);
      return () => { active = false; };
    }
    setCveImpactLoading(true);
    setCveImpactError(null);
    void fetchCveImpactList('selected', applicationIris)
      .then((response) => { if (active) setCveImpact(response); })
      .catch((error: unknown) => {
        if (active) {
          console.error(`Failed to load CVE impact for ${applicationIris.join(', ')}.`, error);
          setCveImpact(null);
          setCveImpactError('Unable to load CVE impact data.');
        }
      })
      .finally(() => { if (active) setCveImpactLoading(false); });
    return () => { active = false; };
  }, [activeTab, selectionKey, cveImpactReloadCounter]);

  function handleRefreshWorkspace() {
    setReloadCounter((current) => current + 1);
  }

  const hasApplications = selectableSummaries.length > 0 && selectedApplicationIris.length > 0;
  const primaryApplicationIri = selectedApplicationIris[0] ?? '';

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <RestCallProgress visible={summariesLoading || workspaceLoading} />
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={2}>
            {summariesError ? <Alert severity="error">{summariesError}</Alert> : null}
            {workspaceError ? <Alert severity="error">{workspaceError}</Alert> : null}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <ApplicationMultiSelector
                applications={selectableSummaries}
                selectedApplicationIris={selectedApplicationIris}
                loading={summariesLoading}
                onChange={setSelectedApplicationIris}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <ExploreTabs value={activeTab} onChange={setActiveTab} disabled={!hasApplications} />
              </Box>
            </Stack>

            {!hasApplications ? (
              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 2,
                  py: 2.25,
                  bgcolor: 'background.paper'
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  {selectableSummaries.length === 0
                    ? 'No applications have been ingested yet. Upload a CycloneDX SBOM to begin.'
                    : 'Select one or more applications to explore.'}
                </Typography>
              </Box>
            ) : workspaceError ? null : (
              <Box sx={{ pt: 0.5 }} key={selectionKey || 'no-application'}>
                {activeTab === 'overview' ? (
                  <ApplicationOverview overview={overview} loading={workspaceLoading} />
                ) : null}

                {activeTab === 'dependencies' ? (
                  <DependenciesView
                    dependencies={dependencies}
                    loading={workspaceLoading}
                    error={null}
                    onRefresh={handleRefreshWorkspace}
                  />
                ) : null}

                {activeTab === 'vulnerabilities' ? (
                  <VulnerabilitiesView
                    response={vulnerabilities}
                    loading={vulnerabilitiesLoading || (!vulnerabilities && !vulnerabilitiesError)}
                    error={vulnerabilitiesError}
                    onRefresh={() => setVulnerabilitiesReloadCounter((current) => current + 1)}
                    onOpenEnrichment={() => onOpenVulnerabilityEnrichment(primaryApplicationIri)}
                  />
                ) : null}
                {activeTab === 'references' ? (
                  <ReferencesView
                    response={references}
                    loading={referencesLoading || (!references && !referencesError)}
                    error={referencesError}
                    onRefresh={() => setReferencesReloadCounter((current) => current + 1)}
                    onOpenEnrichment={() => onOpenVulnerabilityEnrichment(primaryApplicationIri)}
                  />
                ) : null}
                {activeTab === 'cve-impact' ? (
                  <CveImpactView
                    selectedApplicationIris={selectedApplicationIris}
                    response={cveImpact}
                    loading={
                      selectedApplicationIris.length > 0
                      && (cveImpactLoading || (!cveImpact && !cveImpactError))
                    }
                    error={cveImpactError}
                    onRefresh={() => setCveImpactReloadCounter((current) => current + 1)}
                    onOpenEnrichment={() => onOpenVulnerabilityEnrichment(primaryApplicationIri)}
                  />
                ) : null}
              </Box>
            )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function preserveSelection(
  current: string[],
  nextSummaries: ApplicationSummary[],
  preferredIri?: string | null
): string[] {
  const selectableSummaries = nextSummaries.filter(
    (summary): summary is ApplicationSummary & { iri: string } => Boolean(summary.iri?.trim())
  );

  const normalizedPreferredIri = preferredIri?.trim() ?? '';
  if (normalizedPreferredIri) {
    const preferred = selectableSummaries.find((summary) => summary.iri === normalizedPreferredIri);
    if (preferred) {
      return [preferred.iri];
    }
  }

  const validIris = new Set(selectableSummaries.map(({ iri }) => iri));
  const preserved = current.filter((iri) => validIris.has(iri));
  if (preserved.length > 0) {
    return preserved;
  }

  return selectableSummaries[0] ? [selectableSummaries[0].iri] : [];
}

function mergeDependencies(dependencies: DependencySummary[]): DependencySummary[] {
  const merged = new Map<string, DependencySummary>();
  dependencies.forEach((dependency) => {
    const current = merged.get(dependency.iri);
    merged.set(dependency.iri, current
      ? { ...current, ...dependency, direct: Boolean(current.direct || dependency.direct) }
      : dependency);
  });
  return Array.from(merged.values());
}

function mergeOverviews(
  overviews: ApplicationOverviewModel[],
  dependencies: DependencySummary[]
): ApplicationOverviewModel {
  const sum = (field: keyof ApplicationOverviewModel) => overviews.reduce((total, overview) => {
    const value = overview[field];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
  const enrichedDates = overviews
    .map(({ lastEnrichedAt }) => lastEnrichedAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  return {
    directDependencyCount: sum('directDependencyCount'),
    transitiveDependencyCount: sum('transitiveDependencyCount'),
    uniquePackageCount: dependencies.length,
    graphNodeCount: sum('graphNodeCount'),
    graphEdgeCount: sum('graphEdgeCount'),
    vulnerablePackages: sum('vulnerablePackages'),
    criticalVulnerabilities: sum('criticalVulnerabilities'),
    lastEnrichedAt: enrichedDates.at(-1) ?? null
  };
}

function mergeVulnerabilityResponses(
  applicationIris: string[],
  responses: ApplicationVulnerabilitiesResponse[]
): ApplicationVulnerabilitiesResponse {
  const items = new Map<string, ApplicationVulnerabilityItem>();
  responses.flatMap(({ items: responseItems }) => responseItems).forEach((item) => {
    items.set(`${item.packageIri}\u0000${item.vulnerabilityIri}`, item);
  });
  return {
    applicationIri: applicationIris.length === 1 ? applicationIris[0] : '',
    total: items.size,
    items: Array.from(items.values())
  };
}

function mergeReferenceResponses(
  applicationIris: string[],
  responses: ApplicationReferencesResponse[]
): ApplicationReferencesResponse {
  const items = new Map<string, ApplicationReferencesResponse['items'][number]>();
  responses.flatMap(({ items: responseItems }) => responseItems).forEach((item) => {
    const key = item.vulnerabilityIri || item.osvId;
    const current = items.get(key);
    if (!current) {
      items.set(key, item);
      return;
    }
    items.set(key, {
      ...current,
      aliases: Array.from(new Set([...current.aliases, ...item.aliases])),
      referenceUrls: Array.from(new Set([...current.referenceUrls, ...item.referenceUrls])),
      affectedPackages: Array.from(
        new Map(
          [...current.affectedPackages, ...item.affectedPackages]
            .map((pkg) => [`${pkg.packageIri}\u0000${pkg.installedVersion}`, pkg])
        ).values()
      )
    });
  });
  return {
    applicationIri: applicationIris.length === 1 ? applicationIris[0] : '',
    total: items.size,
    items: Array.from(items.values())
  };
}
