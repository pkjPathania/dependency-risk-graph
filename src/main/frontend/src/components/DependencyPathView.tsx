import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import type { DependencyPathNode, DependencyPathResponse } from '../api/types';
import { DependencyPathNodeCard } from './DependencyPathNodeCard';

interface DependencyPathViewProps {
  loading: boolean;
  error: string | null;
  hasQueried: boolean;
  response: DependencyPathResponse | null;
}

export function DependencyPathView({ loading, error, hasQueried, response }: DependencyPathViewProps) {
  const path = Array.isArray(response?.path) ? response.path : [];
  const found = response?.found === true;
  const hops = typeof response?.hops === 'number' ? response.hops : 0;
  const nodeCount = path.length;

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 3 }}>
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
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="body2" color="text.secondary">
            Enter a package name and optional version, then run the search to display the dependency chain.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!found) {
    return (
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              Dependency path not found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The backend did not return a dependency chain for the selected package and version.
            </Typography>
            <SummaryBar found={found} hops={hops} nodeCount={nodeCount} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (path.length === 0) {
    return (
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              No path data returned
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The API reported a match, but the dependency chain was empty.
            </Typography>
            <SummaryBar found={found} hops={hops} nodeCount={nodeCount} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              Dependency path
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A vertical chain from the application root to the selected dependency.
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
      <Metric label="Found" value={found ? 'Yes' : 'No'} accent={found ? 'success' : 'warning'} />
      <Metric label="Hops" value={String(hops)} accent="primary" />
      <Metric label="Nodes" value={String(nodeCount)} accent="info" />
    </Box>
  );
}

function Metric({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent: 'primary' | 'success' | 'info' | 'warning';
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: `${accent}.main`,
        borderRadius: 1,
        px: 1,
        py: 0.9,
        bgcolor: `${accent}.light`
      }}
    >
      <Stack spacing={0.4}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {label}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.1 }}>
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}

function getNodeKey(node: DependencyPathNode | null | undefined, index: number): string {
  if (node?.iri) {
    return node.iri;
  }

  return `dependency-node-${index}`;
}
