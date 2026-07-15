import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { exportSbomRdf, uploadSbom } from '../api/sbomApi';
import type { NormalizedSbom } from '../api/types';
import { SummaryCard } from '../components/SummaryCard';
import { AssistantPanel } from '../features/assistant/AssistantPanel';
import { DependencyGraph } from '../features/graph/DependencyGraph';
import { mapNormalizedSbomToGraph } from '../features/graph/graphMapper';
import { PackageDetailsPanel } from '../features/graph/PackageDetailsPanel';
import { RdfSummaryPanel } from '../features/sbom/RdfSummaryPanel';
import { SbomUploadPanel } from '../features/sbom/SbomUploadPanel';
import type { GraphSummary } from '../api/types';

const INITIAL_SBOM: NormalizedSbom | null = null;

export function DashboardPage() {
  const [sbom, setSbom] = useState<NormalizedSbom | null>(INITIAL_SBOM);
  const [isUploading, setIsUploading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rdfStatusMessage, setRdfStatusMessage] = useState<string | null>(null);
  const [rdfSummary, setRdfSummary] = useState<GraphSummary | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const graph = useMemo(() => {
    if (!sbom) {
      return null;
    }

    return mapNormalizedSbomToGraph(sbom, { expandedNodeIds, maxInitialDepth: 2 });
  }, [expandedNodeIds, sbom]);

  async function handleUpload(file: File) {
    setIsUploading(true);
    setBackendError(null);
    setSuccessMessage(null);
    setRdfStatusMessage(null);
    setRdfSummary(null);

    try {
      const nextSbom = await uploadSbom(file);
      setSbom(nextSbom);
      setSelectedNodeId(null);
      setExpandedNodeIds(new Set());
      setSearchTerm('');
      setSuccessMessage(`Uploaded ${nextSbom.applicationName} successfully.`);
      try {
        const summary = await exportSbomRdf(file);
        setRdfSummary(summary);
        setRdfStatusMessage(
          `RDF graph ready: ${summary.trippleCount} triples, ${summary.applicationCount} application, ${summary.packageCount} packages, ${summary.dependencyEdgeCount} dependency edges.`
        );
      } catch {
        setRdfStatusMessage('RDF export could not be generated.');
      }
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : 'Failed to upload SBOM.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleToggleExpandNode(nodeId: string) {
    setExpandedNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  const applicationName = sbom?.applicationName ?? 'Waiting for upload';
  const applicationVersion = sbom?.applicationVersion ?? 'Not provided';
  const directDependencyCount = graph ? graph.childRefsBySource.get(graph.rootId)?.length ?? 0 : 0;
  const totalComponentCount = sbom?.components.length ?? 0;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.8rem', md: '2.1rem' } }}>
          Dependency Risk Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Analyze SBOMs, dependency paths, and vulnerability exposure
        </Typography>
      </Box>

      <SbomUploadPanel
        onUpload={handleUpload}
        loading={isUploading}
        backendError={backendError}
        successMessage={successMessage}
        rdfStatusMessage={rdfStatusMessage}
      />

      <RdfSummaryPanel summary={rdfSummary} />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }
        }}
      >
        <Box>
          <SummaryCard label="Application name" value={applicationName} />
        </Box>
        <Box>
          <SummaryCard label="Application version" value={applicationVersion} />
        </Box>
        <Box>
          <SummaryCard label="Direct dependency count" value={String(directDependencyCount)} />
        </Box>
        <Box>
          <SummaryCard label="Total component count" value={String(totalComponentCount)} />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          alignItems: 'stretch',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(320px, 1fr)' }
        }}
      >
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              {graph ? (
                <DependencyGraph
                  graph={graph}
                  selectedNodeId={selectedNodeId}
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  onSelectNode={setSelectedNodeId}
                  onToggleExpandNode={handleToggleExpandNode}
                />
              ) : (
                <Stack spacing={1.5}>
                  <Typography variant="h6">Dependency graph</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload a CycloneDX JSON SBOM to render the application and dependency inventory.
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box>
          <PackageDetailsPanel graph={graph} selectedNodeId={selectedNodeId} onToggleExpandNode={handleToggleExpandNode} />
        </Box>
      </Box>

      <AssistantPanel />
    </Stack>
  );
}
