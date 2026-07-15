import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import { escapePercent } from '../../api/sbomApi';
import type { GraphModel } from './graphMapper';

interface PackageDetailsPanelProps {
  graph: GraphModel | null;
  selectedNodeId: string | null;
  onToggleExpandNode: (nodeId: string) => void;
}

export function PackageDetailsPanel({
  graph,
  selectedNodeId,
  onToggleExpandNode
}: PackageDetailsPanelProps) {
  const selectedNode = selectedNodeId && graph ? graph.nodesById.get(selectedNodeId) : undefined;
  const directChildCount =
    selectedNode && graph ? graph.childRefsBySource.get(selectedNode.bomRef)?.length ?? 0 : 0;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Package details</Typography>
            <Typography variant="body2" color="text.secondary">
              Selected node metadata and local expansion controls.
            </Typography>
          </Box>
          <Divider />

          {selectedNode ? (
            <Stack spacing={1.25}>
              <DetailRow label="Name" value={escapePercent(selectedNode.name)} />
              <DetailRow label="Version" value={escapePercent(selectedNode.version ?? 'Not provided')} />
              <DetailRow label="PURL" value={escapePercent(selectedNode.purl ?? 'Not provided')} />
              <DetailRow label="RDF type" value={escapePercent(selectedNode.type ?? 'Not provided')} />
              <DetailRow label="Direct child dependency count" value={String(directChildCount)} />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={selectedNode.isApplication ? 'Application root' : 'Package version'}
                  color={selectedNode.isApplication ? 'primary' : 'default'}
                  variant={selectedNode.isApplication ? 'filled' : 'outlined'}
                />
                <Chip label={`Visible children: ${selectedNode.visibleChildCount}`} variant="outlined" />
              </Stack>
              <Chip
                label="Vulnerability state: not yet enriched"
                variant="outlined"
                sx={{ alignSelf: 'flex-start' }}
              />
              {!selectedNode.isApplication ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Expand this node to reveal deeper dependencies.
                  </Typography>
                  <Chip
                    label={selectedNode.hasHiddenChildren ? 'Expand node' : 'No deeper children'}
                    onClick={() => onToggleExpandNode(selectedNode.bomRef)}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ) : null}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a node in the graph to inspect package metadata.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}
