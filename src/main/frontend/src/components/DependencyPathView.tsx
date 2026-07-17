import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import type { DependencyPathNode, DependencyPathResponse } from '../api/types';
import { DependencyPathNodeCard } from './DependencyPathNodeCard';
import { OverviewMetricCard } from '../features/explore/OverviewMetricCard';

interface DependencyPathViewProps {
  loading: boolean;
  error: string | null;
  hasQueried: boolean;
  response: DependencyPathResponse | null;
  idleMessage?: string;
  notFoundMessage?: string;
  emptyPathMessage?: string;
}

export function DependencyPathView({
  loading,
  error,
  hasQueried,
  response,
  idleMessage = 'Enter a package name and optional version, then run the search to display the dependency chain.',
  notFoundMessage = 'The backend did not return a dependency chain for the selected package and version.',
  emptyPathMessage = 'The API reported a match, but the dependency chain was empty.'
}: DependencyPathViewProps) {
  const path = Array.isArray(response?.path) ? response.path : [];
  const found = response?.found === true;
  const hops = typeof response?.hops === 'number' ? response.hops : 0;
  const nodeCount = path.length;

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 2.5 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              Loading dependency path...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
        {error}
      </Alert>
    );
  }

  if (!hasQueried) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="body2" color="text.secondary">
            {idleMessage}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!found) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack spacing={1.25}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, fontWeight: 800 }}>
              Dependency path not found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
              {notFoundMessage}
            </Typography>
            <SummaryBar found={found} hops={hops} nodeCount={nodeCount} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (path.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack spacing={1.25}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, fontWeight: 800 }}>
              No path data returned
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
              {emptyPathMessage}
            </Typography>
            <SummaryBar found={found} hops={hops} nodeCount={nodeCount} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack spacing={1.25}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, fontWeight: 800 }}>
              Dependency path
            </Typography>
            <SummaryBar found={found} hops={hops} nodeCount={nodeCount} />
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1} alignItems="stretch">
        {path.map((node, index) => (
          <Box key={getNodeKey(node, index)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 560 }}>
              <DependencyPathNodeCard node={node ?? {}} />
            </Box>
            {index < path.length - 1 ? (
              <Stack spacing={0.25} alignItems="center" sx={{ py: 0.75 }}>
                <ArrowDownwardOutlinedIcon color="action" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  depends on
                </Typography>
              </Stack>
            ) : null}
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

function SummaryBar({
  found,
  hops,
  nodeCount
}: {
  found: boolean;
  hops: number;
  nodeCount: number;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 0.75,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }
      }}
    >
      <OverviewMetricCard label="Found" value={found ? 'Yes' : 'No'} caption="" loading={false} />
      <OverviewMetricCard label="Hops" value={String(hops)} caption="" loading={false} />
      <OverviewMetricCard label="Nodes" value={String(nodeCount)} caption="" loading={false} />
    </Box>
  );
}

function getNodeKey(node: DependencyPathNode | null | undefined, index: number): string {
  if (node?.iri) {
    return node.iri;
  }

  return `dependency-node-${index}`;
}
