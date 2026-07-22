import { Box, Typography } from '@mui/material';

interface EvidenceEmptyStateProps {
  hasSearched: boolean;
}

export function EvidenceEmptyState({ hasSearched }: EvidenceEmptyStateProps) {
  return (
    <Box sx={{ py: 2, px: 0.5 }} role="status">
      <Typography variant="subtitle1" fontWeight={700}>
        {hasSearched ? 'No evidence matched' : 'Search advisory evidence'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {hasSearched
          ? 'Try lowering the minimum score or asking a more specific question.'
          : 'Use natural language to inspect the evidence currently indexed for Buggy.'}
      </Typography>
      {hasSearched ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontWeight: 600 }}>
          🐞 Buggy found no receipts for that query.
        </Typography>
      ) : null}
    </Box>
  );
}
