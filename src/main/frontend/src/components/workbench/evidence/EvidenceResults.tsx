import { Chip, Stack, Typography } from '@mui/material';
import type { AdvisoryEvidenceMatch } from '../../../api/workbenchEvidence';
import { designTokens } from '../../../theme/designTokens';
import { EvidenceEmptyState } from './EvidenceEmptyState';
import { EvidenceResultCard } from './EvidenceResultCard';
import { extractVulnerabilityIdentifier, isExactIdentifierMatch } from './evidenceSearchUtils';
import { GlobalSearchNotice } from './GlobalSearchNotice';

interface EvidenceResultsProps {
  results: AdvisoryEvidenceMatch[];
  submittedQuery: string;
  hasSearched: boolean;
  expandedIds: ReadonlySet<string>;
  onToggleExpanded: (id: string) => void;
  onCopySuccess: () => void;
  onCopyError: (message: string) => void;
}

export function EvidenceResults({
  results,
  submittedQuery,
  hasSearched,
  expandedIds,
  onToggleExpanded,
  onCopySuccess,
  onCopyError
}: EvidenceResultsProps) {
  if (!hasSearched || results.length === 0) {
    return <EvidenceEmptyState hasSearched={hasSearched} />;
  }

  const queryIdentifier = extractVulnerabilityIdentifier(submittedQuery);

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.25} aria-live="polite">
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          useFlexGap
          flexWrap="wrap"
        >
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 800 }}>
            {results.length} evidence {results.length === 1 ? 'match' : 'matches'}
          </Typography>
          <Chip
            size="small"
            label="Global semantic discovery"
            variant="outlined"
            sx={{
              bgcolor: designTokens.surface.panel,
              borderColor: designTokens.border.strong,
              color: designTokens.text.secondary,
              fontWeight: 700
            }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          for “{submittedQuery}”
        </Typography>
      </Stack>

      <GlobalSearchNotice />

      {results.map((match, index) => (
        <EvidenceResultCard
          key={match.id}
          match={match}
          rank={index + 1}
          queryIdentifier={queryIdentifier}
          exactIdentifierMatch={isExactIdentifierMatch(match, queryIdentifier)}
          expanded={expandedIds.has(match.id)}
          onToggleExpanded={() => onToggleExpanded(match.id)}
          onCopySuccess={onCopySuccess}
          onCopyError={onCopyError}
        />
      ))}
    </Stack>
  );
}
