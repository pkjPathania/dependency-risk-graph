import { Alert, Box, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApplicationSummary, GraphMetadata } from '../api/types';
import { fetchGraphMetadata, uploadSbomAsRdf, escapePercent } from '../api/sbomApi';
import { RestCallProgress } from '../components/RestCallProgress';
import { ExploreDataTable } from '../features/explore/ExploreDataTable';
import { OverviewMetricCard } from '../features/explore/OverviewMetricCard';
import { fetchApplicationOverview, fetchApplicationSummaries } from '../features/explore/exploreApi';
import { SbomUploadPanel } from '../features/sbom/SbomUploadPanel';

interface DashboardPageProps {
  onExploreApplication: (applicationIri: string) => void;
}

interface ApplicationRow {
  iri: string;
  name: string;
  version: string | null;
  packageCount: number | null;
}

export function DashboardPage({ onExploreApplication }: DashboardPageProps) {
  const mountedRef = useRef(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rdfStatusMessage, setRdfStatusMessage] = useState<string | null>(null);
  const [graphMetadata, setGraphMetadata] = useState<GraphMetadata | null>(null);
  const [applicationRows, setApplicationRows] = useState<ApplicationRow[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void loadGraphMetadata();
    void loadApplicationRows();
  }, []);

  const metrics = useMemo(() => {
    const summary = graphMetadata?.summary;
    const graphNodeCount = graphMetadata?.graph['@graph']?.length ?? null;

    return [
      { label: 'Triples', value: formatCount(summary?.trippleCount), caption: 'RDF statements' },
      { label: 'Applications', value: formatCount(summary?.applicationCount), caption: 'Ingested applications' },
      { label: 'Packages', value: formatCount(summary?.packageCount), caption: 'Package-version resources' },
      {
        label: 'Dependency edges',
        value: formatCount(summary?.dependencyEdgeCount),
        caption: 'Relationships in the graph'
      },
      { label: 'Graph nodes', value: formatCount(graphNodeCount), caption: 'Nodes in the RDF graph' }
    ];
  }, [graphMetadata]);

  async function loadGraphMetadata() {
    setIsLoadingMetadata(true);
    try {
      const metadata = await fetchGraphMetadata();
      if (!mountedRef.current) {
        return;
      }

      setGraphMetadata(metadata);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      console.error('Failed to load graph metadata.', error);
      setBackendError(error instanceof Error ? error.message : 'Failed to load graph metadata.');
    } finally {
      if (mountedRef.current) {
        setIsLoadingMetadata(false);
      }
    }
  }

  async function loadApplicationRows() {
    setApplicationsLoading(true);
    setApplicationsError(null);
    setApplicationRows([]);

    try {
      const summaries = await fetchApplicationSummaries();
      const selectableSummaries = summaries.filter(
        (summary): summary is ApplicationSummary & { iri: string } => Boolean(summary.iri?.trim())
      );

      const nextRows = await Promise.all(
        selectableSummaries.map(async (summary) => {
          let packageCount: number | null = null;

          try {
            const overview = await fetchApplicationOverview(summary.iri);
            packageCount = overview.uniquePackageCount ?? null;
          } catch (error) {
            console.error(`Failed to load application overview for ${summary.iri}.`, error);
          }

          return {
            iri: summary.iri,
            name: summary.name ?? 'Unknown',
            version: summary.version ?? null,
            packageCount
          };
        })
      );

      if (!mountedRef.current) {
        return;
      }

      setApplicationRows(nextRows);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      console.error('Failed to load application summaries.', error);
      setApplicationsError('Unable to load applications.');
      setApplicationRows([]);
    } finally {
      if (mountedRef.current) {
        setApplicationsLoading(false);
      }
    }
  }

  async function handleUpload(file: File) {
    setIsUploading(true);
    setBackendError(null);
    setSuccessMessage(null);
    setRdfStatusMessage(null);

    try {
      const metadata = await uploadSbomAsRdf(file);
      if (!mountedRef.current) {
        return;
      }

      setGraphMetadata(metadata);
      await loadApplicationRows();
      setSuccessMessage(`Uploaded ${escapePercent(file.name)} successfully.`);
      setRdfStatusMessage(
        `JSON-LD assembly completed. The graph now contains ${metadata.summary.applicationCount} applications, ${metadata.summary.packageCount} packages, and ${metadata.summary.dependencyEdgeCount} dependency edges.`
      );
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      setBackendError(error instanceof Error ? error.message : 'Failed to upload SBOM.');
    } finally {
      if (mountedRef.current) {
        setIsUploading(false);
      }
    }
  }

  const isBusy = isLoadingMetadata || isUploading || applicationsLoading;

  return (
    <Stack spacing={2}>
      <RestCallProgress visible={isBusy} />

      <SbomUploadPanel
        onUpload={handleUpload}
        loading={isUploading}
        backendError={backendError}
        successMessage={successMessage}
        rdfStatusMessage={rdfStatusMessage}
      />

      {applicationsError ? <Alert severity="error">{applicationsError}</Alert> : null}

      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }
            }}
          >
            {metrics.map((metric) => (
              <OverviewMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                caption={metric.caption}
                loading={isLoadingMetadata}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      <ExploreDataTable
        title="Applications"
        description="Open an application in Explore."
        loading={applicationsLoading}
        error={null}
        emptyMessage="No applications have been ingested yet. Upload a CycloneDX SBOM to begin."
        isEmpty={applicationRows.length === 0}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Applications table">
            <TableHead>
              <TableRow>
                <HeaderCell>Name</HeaderCell>
                <HeaderCell>Version</HeaderCell>
                <HeaderCell align="right">Package Count</HeaderCell>
                <HeaderCell align="center">Explore action</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applicationsLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`application-skeleton-${index}`}>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">
                          Loading applications...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                : applicationRows.map((row) => (
                    <TableRow hover key={row.iri}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.version ?? 'Unknown'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCount(row.packageCount)}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onExploreApplication(row.iri)}
                          sx={{ minWidth: 92 }}
                        >
                          Explore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </Box>
      </ExploreDataTable>
    </Stack>
  );
}

function HeaderCell({
  children,
  align = 'left'
}: {
  children: string;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <TableCell align={align} sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
      {children}
    </TableCell>
  );
}

function formatCount(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return value.toLocaleString();
}
