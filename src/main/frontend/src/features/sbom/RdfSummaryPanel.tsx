import SchemaOutlinedIcon from '@mui/icons-material/SchemaOutlined';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { GraphMetadata } from '../../api/types';

interface RdfSummaryPanelProps {
  metadata: GraphMetadata | null;
}

export function RdfSummaryPanel({ metadata }: RdfSummaryPanelProps) {
  if (!metadata) {
    return null;
  }

  const summary = metadata.summary;
  const graphNodeCount = metadata.graph['@graph']?.length ?? 0;

  return (
    <Card sx={{ border: '1px solid', borderColor: 'primary.light', backgroundColor: '#f8fbff' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
            <SchemaOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="h6">RDF graph summary</Typography>
            <Chip
              label="/api/v1/sboms/rdf"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ ml: 'auto' }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            The backend converted the uploaded SBOM into an RDF knowledge graph.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 1.25,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }
            }}
          >
            <MetricCard label="Triples" value={summary.trippleCount.toLocaleString()} accent="primary" />
            <MetricCard label="Applications" value={summary.applicationCount.toLocaleString()} accent="success" />
            <MetricCard label="Packages" value={summary.packageCount.toLocaleString()} accent="info" />
            <MetricCard
              label="Dependency edges"
              value={summary.dependencyEdgeCount.toLocaleString()}
              accent="warning"
            />
            <MetricCard label="Graph nodes" value={graphNodeCount.toLocaleString()} accent="primary" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function MetricCard({
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
        borderRadius: 1.5,
        px: 1.5,
        py: 1.25,
        bgcolor: `${accent}.light`
      }}
    >
      <Stack spacing={0.4}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}
