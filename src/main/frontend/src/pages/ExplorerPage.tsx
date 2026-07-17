import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import type { ApplicationSummary } from '../api/types';
import { RestCallProgress } from '../components/RestCallProgress';
import { ApplicationSelector } from '../features/explore/ApplicationSelector';
import { ApplicationOverview } from '../features/explore/ApplicationOverview';
import { DependenciesView } from '../features/explore/DependenciesView';
import { fetchApplicationDependencies, fetchApplicationOverview, fetchApplicationSummaries } from '../features/explore/exploreApi';
import type { ExploreTab } from '../features/explore/exploreTypes';
import { ExploreTabs } from '../features/explore/ExploreTabs';
import { IriValue } from '../features/explore/IriValue';
import { ReferencesView } from '../features/explore/ReferencesView';
import { VulnerabilitiesView } from '../features/explore/VulnerabilitiesView';

interface ExplorerPageProps {
  initialApplicationIri?: string | null;
}

export function ExplorerPage({ initialApplicationIri }: ExplorerPageProps) {
  const [summaries, setSummaries] = useState<ApplicationSummary[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationSummary | null>(null);
  const [activeTab, setActiveTab] = useState<ExploreTab>('overview');
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchApplicationOverview>> | null>(null);
  const [dependencies, setDependencies] = useState<Awaited<ReturnType<typeof fetchApplicationDependencies>>>([]);
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

                {activeTab === 'vulnerabilities' ? <VulnerabilitiesView /> : null}
                {activeTab === 'references' ? <ReferencesView /> : null}
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
