import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { Box, Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import type { DependencyPathNode } from '../api/types';
import { designTokens } from '../theme/designTokens';

interface DependencyPathNodeCardProps {
  node: DependencyPathNode;
}

export function DependencyPathNodeCard({ node }: DependencyPathNodeCardProps) {
  const isApplication = normalizeType(node.type) === 'APPLICATION';
  const label = node.label ?? 'Unknown';
  const version = node.version ?? 'Unknown version';
  const nodeType = node.type ?? 'Unknown type';
  const iri = node.iri ?? 'Unknown IRI';
  const purl = node.purl ?? null;

  async function handleCopyPurl() {
    if (!purl || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(purl);
    } catch {
      // Ignore clipboard failures.
    }
  }

  return (
    <Card
      sx={{
        width: '100%',
        borderLeft: '4px solid',
        borderLeftColor: isApplication ? designTokens.colors.navigation : designTokens.security.low,
        backgroundColor: isApplication ? designTokens.colors.surfaceMuted : designTokens.colors.surface,
        borderRadius: 1.5
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={0.85}>
          <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {iri}
              </Typography>
            </Box>
            <Chip
              label={isApplication ? 'Application' : 'Package version'}
              color={isApplication ? 'primary' : 'info'}
              variant={isApplication ? 'filled' : 'outlined'}
              size="small"
            />
          </Stack>

          <DetailRow label="Version" value={version} />
          <DetailRow label="Node type" value={nodeType} />

          {purl ? (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  PURL
                </Typography>
                <Tooltip title="Copy PURL">
                  <IconButton size="small" onClick={handleCopyPurl} aria-label="Copy PURL" sx={{ p: 0.5 }}>
                    <ContentCopyOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography
                variant="caption"
                sx={{ mt: 0.25, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {purl}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        {label}
      </Typography>
      <Typography variant="caption" sx={{ mt: 0.2, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  );
}

function normalizeType(value: string | null | undefined): string {
  return value ? value.toUpperCase() : '';
}
