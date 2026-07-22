import { Chip, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { AdvisoryEvidenceMatch } from '../../../api/workbenchEvidence';
import { designTokens } from '../../../theme/designTokens';

interface EvidenceResultHeaderProps {
  match: AdvisoryEvidenceMatch;
  rank: number;
  exactIdentifierMatch: boolean;
  vulnerabilityId: ReactNode;
  segmentTone: {
    background: string;
    border: string;
    text: string;
  };
}

export function EvidenceResultHeader({
  match,
  rank,
  exactIdentifierMatch,
  vulnerabilityId,
  segmentTone
}: EvidenceResultHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
    >
      <Stack spacing={0.75} minWidth={0}>
        <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
            #{rank}
          </Typography>
          <Chip
            size="small"
            label={match.segmentType}
            variant="outlined"
            sx={{
              bgcolor: segmentTone.background,
              borderColor: segmentTone.border,
              color: segmentTone.text,
              fontWeight: 800
            }}
          />
          {exactIdentifierMatch ? (
            <Chip
              size="small"
              label="Exact identifier match"
              variant="outlined"
              sx={{
                bgcolor: designTokens.surface.panel,
                borderColor: designTokens.border.strong,
                color: designTokens.text.secondary,
                fontWeight: 700
              }}
            />
          ) : null}
        </Stack>
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', fontWeight: 700, overflowWrap: 'anywhere' }}
        >
          {vulnerabilityId}
        </Typography>
      </Stack>

      <Stack spacing={0.125} sx={{ flexShrink: 0, textAlign: { xs: 'left', sm: 'right' } }}>
        <Typography variant="caption" color="text.secondary">
          Similarity score
        </Typography>
        <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.2 }}>
          {match.score.toFixed(3)}
        </Typography>
      </Stack>
    </Stack>
  );
}
