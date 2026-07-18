import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import type {
  ApplicationReferencesResponse,
  ApplicationSummary,
  ApplicationVulnerabilitiesResponse,
  CveImpactListResponse,
  CveImpactScope
} from '../api/types';
import { RestCallProgress } from '../components/RestCallProgress';
import { ApplicationSelector } from '../features/explore/ApplicationSelector';
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
import { IriValue } from '../features/explore/IriValue';
import { ReferencesView } from '../features/explore/ReferencesView';
import { VulnerabilitiesView } from '../features/explore/VulnerabilitiesView';

interface ExplorerPageProps {
  initialApplicationIri?: string | null;
  onOpenVulnerabilityEnrichment: (applicationIri: string) => void;
}

export function ExplorerPage({ initialApplicationIri, onOpenVulnerabilityEnrichment }: ExplorerPageProps) {
  const [summaries, setSummaries] = useState<ApplicationSummary[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationSummary | null>(null);
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
  const [cveImpactScope, setCveImpactScope] = useState<CveImpactScope>('selected');
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
        setSelectedApplication((current) => preserveSelection(current, nextSummaries, initialApplicationIri));
      } catch (error) {
        if (!active) {
          return;
        }

        console.error('Failed to load application summaries.', error);
        setSummaries([]);
        setSelectedApplication(null);
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
    const applicationIri = selectedApplication?.iri?.trim() ?? '';

    if (!applicationIri) {
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
        const [nextOverview, nextDependencies] = await Promise.all([
          fetchApplicationOverview(applicationIri),
          fetchApplicationDependencies(applicationIri)
        ]);
        if (!active) {
          return;
        }

        setOverview(nextOverview);
        setDependencies(nextDependencies);
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(`Failed to load application workspace for ${applicationIri}.`, error);
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
  }, [reloadCounter, selectedApplication?.iri]);

  useEffect(() => {
    setVulnerabilities(null);
    setVulnerabilitiesError(null);
  }, [selectedApplication?.iri]);

  useEffect(() => {
    let active = true;
    const applicationIri = selectedApplication?.iri?.trim() ?? '';
    if (activeTab !== 'vulnerabilities' || !applicationIri) {
      return () => {
        active = false;
      };
    }

    setVulnerabilitiesLoading(true);
    setVulnerabilitiesError(null);

    async function loadVulnerabilities() {
      try {
        const response = await fetchApplicationVulnerabilities(applicationIri);
        if (active) {
          setVulnerabilities(response);
        }
      } catch (error) {
        if (active) {
          console.error(`Failed to load vulnerabilities for ${applicationIri}.`, error);
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
  }, [activeTab, selectedApplication?.iri, vulnerabilitiesReloadCounter]);

  useEffect(() => {
    setReferences(null);
    setReferencesError(null);
  }, [selectedApplication?.iri]);

  useEffect(() => {
    let active = true;
    const applicationIri = selectedApplication?.iri?.trim() ?? '';
    if (activeTab !== 'references' || !applicationIri) {
      return () => {
        active = false;
      };
    }

    setReferencesLoading(true);
    setReferencesError(null);

    async function loadReferences() {
      try {
        const response = await fetchApplicationReferences(applicationIri);
        if (active) {
          setReferences(response);
        }
      } catch (error) {
        if (active) {
          console.error(`Failed to load advisory references for ${applicationIri}.`, error);
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
  }, [activeTab, referencesReloadCounter, selectedApplication?.iri]);

  useEffect(() => {
    setCveImpact(null);
    setCveImpactError(null);
  }, [selectedApplication?.iri, cveImpactScope]);

  useEffect(() => {
    let active = true;
    const applicationIri = selectedApplication?.iri?.trim() ?? '';
    if (activeTab !== 'cve-impact' || !applicationIri) {
      return () => { active = false; };
    }
    setCveImpactLoading(true);
    setCveImpactError(null);
    void fetchCveImpactList(cveImpactScope, applicationIri)
      .then((response) => { if (active) setCveImpact(response); })
      .catch((error: unknown) => {
        if (active) {
          console.error(`Failed to load CVE impact for ${applicationIri}.`, error);
          setCveImpact(null);
          setCveImpactError('Unable to load CVE impact data.');
        }
      })
      .finally(() => { if (active) setCveImpactLoading(false); });
    return () => { active = false; };
  }, [activeTab, cveImpactReloadCounter, cveImpactScope, selectedApplication?.iri]);

  function handleApplicationSelect(applicationIri: string) {
    const nextApplication = selectableSummaries.find((summary) => summary.iri === applicationIri) ?? null;
    setSelectedApplication(nextApplication);
  }

  function handleRefreshWorkspace() {
    setReloadCounter((current) => current + 1);
  }

  const hasApplications = selectableSummaries.length > 0 && selectedApplication !== null;
  const selectedApplicationIri = selectedApplication?.iri ?? '';

  return (
    <Stack spacing={3}>
      <RestCallProgress visible={summariesLoading || workspaceLoading} />

      {summariesError ? <Alert severity="error">{summariesError}</Alert> : null}

      <Card>
        <CardContent sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Box
              sx={{
                display: 'grid',
                gap: 0.75,
                gridTemplateColumns: { xs: '1fr', md: '3fr 6fr 3fr' },
                alignItems: 'stretch'
              }}
            >
              <FieldShell label="APPLICATION">
                <ApplicationSelector
                  summaries={selectableSummaries}
                  selectedApplicationIri={selectedApplicationIri}
                  loading={summariesLoading}
                  onSelectApplication={handleApplicationSelect}
                />
              </FieldShell>

              <FieldShell label="IRI">
                <IriValue value={selectedApplicationIri} />
              </FieldShell>

              <FieldShell label="VERSION">
                <Chip
                  size="small"
                  label={selectedApplication?.version ?? 'Unknown'}
                  variant="outlined"
                  sx={chipSx}
                />
              </FieldShell>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            {workspaceError ? <Alert severity="error">{workspaceError}</Alert> : null}
            <ExploreTabs value={activeTab} onChange={setActiveTab} disabled={!hasApplications} />

            {!hasApplications ? (
              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 2,
                  py: 2.25,
                  bgcolor: 'background.default'
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  No applications have been ingested yet. Upload a CycloneDX SBOM to begin.
                </Typography>
              </Box>
            ) : workspaceError ? null : (
              <Box sx={{ pt: 0.5 }} key={selectedApplicationIri || 'no-application'}>
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
                    onOpenEnrichment={() => onOpenVulnerabilityEnrichment(selectedApplicationIri)}
                  />
                ) : null}
                {activeTab === 'references' ? (
                  <ReferencesView
                    response={references}
                    loading={referencesLoading || (!references && !referencesError)}
                    error={referencesError}
                    onRefresh={() => setReferencesReloadCounter((current) => current + 1)}
                    onOpenEnrichment={() => onOpenVulnerabilityEnrichment(selectedApplicationIri)}
                  />
                ) : null}
                {activeTab === 'cve-impact' ? (
                  <CveImpactView
                    applicationIri={selectedApplicationIri}
                    scope={cveImpactScope}
                    response={cveImpact}
                    loading={cveImpactLoading || (!cveImpact && !cveImpactError)}
                    error={cveImpactError}
                    onScopeChange={setCveImpactScope}
                    onRefresh={() => setCveImpactReloadCounter((current) => current + 1)}
                    onOpenEnrichment={() => onOpenVulnerabilityEnrichment(selectedApplicationIri)}
                  />
                ) : null}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function preserveSelection(
  current: ApplicationSummary | null,
  nextSummaries: ApplicationSummary[],
  preferredIri?: string | null
): ApplicationSummary | null {
  const selectableSummaries = nextSummaries.filter(
    (summary): summary is ApplicationSummary & { iri: string } => Boolean(summary.iri?.trim())
  );

  const normalizedPreferredIri = preferredIri?.trim() ?? '';
  if (normalizedPreferredIri) {
    const preferred = selectableSummaries.find((summary) => summary.iri === normalizedPreferredIri);
    if (preferred) {
      return preferred;
    }
  }

  if (current?.iri) {
    const preserved = selectableSummaries.find((summary) => summary.iri === current.iri);
    if (preserved) {
      return preserved;
    }
  }

  return selectableSummaries[0] ?? null;
}

function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 1.1,
        py: 0.9,
        bgcolor: 'background.default',
        minWidth: 0
      }}
    >
      <Stack spacing={0.25}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, fontSize: '0.67rem' }}
        >
          {label}
        </Typography>
        {children}
      </Stack>
    </Box>
  );
}

const chipSx = {
  alignSelf: 'flex-start',
  fontWeight: 800,
  '& .MuiChip-label': {
    px: 1
  }
};
