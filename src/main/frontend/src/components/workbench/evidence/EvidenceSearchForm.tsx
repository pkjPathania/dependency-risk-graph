import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField
} from '@mui/material';
import type { FormEvent, KeyboardEvent } from 'react';
import { designTokens } from '../../../theme/designTokens';

interface EvidenceSearchFormProps {
  query: string;
  maxResults: string;
  minScore: string;
  searchLoading: boolean;
  rebuildLoading: boolean;
  onQueryChange: (query: string) => void;
  onMaxResultsChange: (maxResults: string) => void;
  onMinScoreChange: (minScore: string) => void;
  onSearch: () => void;
  onRebuild: () => void;
}

export function EvidenceSearchForm({
  query,
  maxResults,
  minScore,
  searchLoading,
  rebuildLoading,
  onQueryChange,
  onMaxResultsChange,
  onMinScoreChange,
  onSearch,
  onRebuild
}: EvidenceSearchFormProps) {
  const searchDisabled = searchLoading || query.trim().length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!searchDisabled) {
      onSearch();
    }
  }

  function handleQueryKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (!searchDisabled) {
        onSearch();
      }
    }
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              id="advisory-evidence-query"
              label="Evidence search query"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={handleQueryKeyDown}
              placeholder="Ask Buggy to search indexed advisory evidence..."
              multiline
              minRows={2}
              fullWidth
              helperText="Press Ctrl+Enter or Cmd+Enter to search."
            />

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
            >
              <TextField
                id="evidence-max-results"
                label="Max results"
                type="number"
                size="small"
                value={maxResults}
                onChange={(event) => onMaxResultsChange(event.target.value)}
                slotProps={{ htmlInput: { min: 1, max: 20, step: 1 } }}
                sx={{ width: { xs: '100%', md: 140 } }}
              />
              <TextField
                id="evidence-minimum-score"
                label="Minimum score"
                type="number"
                size="small"
                value={minScore}
                onChange={(event) => onMinScoreChange(event.target.value)}
                slotProps={{ htmlInput: { min: 0, max: 1, step: 0.05 } }}
                sx={{ width: { xs: '100%', md: 160 } }}
              />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ ml: { md: 'auto' } }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={rebuildLoading ? <CircularProgress size={16} /> : <SyncRoundedIcon />}
                  onClick={onRebuild}
                  disabled={rebuildLoading}
                >
                  {rebuildLoading ? 'Rebuilding…' : 'Rebuild evidence index'}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={searchLoading ? <CircularProgress size={16} color="inherit" /> : <SearchRoundedIcon />}
                  disabled={searchDisabled}
                  sx={{
                    bgcolor: designTokens.shell.topbar,
                    color: designTokens.text.navigationPrimary,
                    '&:hover': { bgcolor: designTokens.shell.sidebarActive },
                    '&:active': { bgcolor: designTokens.shell.sidebarHover },
                    '&.Mui-disabled': {
                      bgcolor: designTokens.disabled.background,
                      color: designTokens.disabled.text
                    }
                  }}
                >
                  Search evidence
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
