import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { escapePercent, fetchGraphMetadata, uploadSbom } from '../api/sbomApi';
import type { GraphMetadata } from '../api/types';
import { SummaryCard } from '../components/SummaryCard';
import { DependencyGraph } from '../features/graph/DependencyGraph';
import { mapGraphMetadataToGraph } from '../features/graph/graphMapper';
import { PackageDetailsPanel } from '../features/graph/PackageDetailsPanel';
import { RdfSummaryPanel } from '../features/sbom/RdfSummaryPanel';
import { SbomUploadPanel } from '../features/sbom/SbomUploadPanel';

export function DashboardPage() {
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rdfStatusMessage, setRdfStatusMessage] = useState<string | null>(null);
  const [graphMetadata, setGraphMetadata] = useState<GraphMetadata | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const graph = useMemo(() => {
    if (!graphMetadata) {
      return null;
    }

    return mapGraphMetadataToGraph(graphMetadata, { expandedNodeIds, maxInitialDepth: 2 });
  }, [expandedNodeIds, graphMetadata]);

  useEffect(() => {
    let active = true;

    async function loadGraphMetadata() {
      setIsLoadingMetadata(true);
      try {
        const metadata = await fetchGraphMetadata();
        if (!active) {
          return;
        }
        setGraphMetadata(metadata);
      } catch (error) {
        if (!active) {
          return;
        }
        setBackendError(error instanceof Error ? error.message : 'Failed to load graph metadata.');
      } finally {
        if (active) {
          setIsLoadingMetadata(false);
        }
      }
    }

    void loadGraphMetadata();

    return () => {
      active = false;
    };
  }, []);

  async function handleUpload(file: File) {
    setIsUploading(true);
    setBackendError(null);
    setSuccessMessage(null);
    setRdfStatusMessage(null);

    try {
      await uploadSbom(file);
      setSelectedNodeId(null);
      setExpandedNodeIds(new Set());
      setSearchTerm('');
      setSuccessMessage(`Uploaded ${escapePercent(file.name)} successfully.`);
      setRdfStatusMessage('SBOM ingested. Click Dashboard to reload /metadata.');
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

  const applicationNode = graph?.nodesById.get(graph.rootId);
  const applicationName = applicationNode ? escapePercent(applicationNode.name) : 'Waiting for metadata';
  const applicationVersion = applicationNode?.version ? escapePercent(applicationNode.version) : 'Not provided';
  const directDependencyCount = graph ? graph.childRefsBySource.get(graph.rootId)?.length ?? 0 : 0;
  const totalComponentCount = graph?.nodesById.size ?? 0;

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

      <RdfSummaryPanel metadata={graphMetadata} />

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
                    {isLoadingMetadata
                      ? 'Loading graph metadata from /api/v1/metadata...'
                      : 'No graph metadata is available yet.'}
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

    </Stack>
  );
}
