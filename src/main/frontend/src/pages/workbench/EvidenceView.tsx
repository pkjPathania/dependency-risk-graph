import { Alert, Chip, LinearProgress, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import {
  rebuildAdvisoryEvidence,
  searchAdvisoryEvidence,
  type AdvisoryEvidenceMatch
} from '../../api/workbenchEvidence';
import { EvidenceResults } from '../../components/workbench/evidence/EvidenceResults';
import { EvidenceSearchForm } from '../../components/workbench/evidence/EvidenceSearchForm';
import { WorkbenchViewHeader } from '../../components/workbench/WorkbenchViewHeader';

const SUGGESTED_QUERIES = [
  'Which versions fix CVE-2026-54515?',
  'Explain how CVE-2026-54515 works technically.',
  'Which vulnerabilities involve unsafe deserialization?',
  'Find advisories related to URI parsing differences.'
] as const;

interface Notification {
  message: string;
  severity: 'success' | 'error';
}

export function EvidenceView() {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState('5');
  const [minScore, setMinScore] = useState('0.55');
  const [results, setResults] = useState<AdvisoryEvidenceMatch[]>([]);
  const [summary, setSummary] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [notification, setNotification] = useState<Notification | null>(null);

  async function handleSearch() {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || searchLoading) {
      return;
    }

    setSearchLoading(true);
    try {
      const resolvedMaxResults = clampedNumber(maxResults, 5, 1, 20, true);
      const resolvedMinScore = clampedNumber(minScore, 0.55, 0, 1);
      setMaxResults(String(resolvedMaxResults));
      setMinScore(String(resolvedMinScore));
      const response = await searchAdvisoryEvidence({
        query: normalizedQuery,
        maxResults: resolvedMaxResults,
        minScore: resolvedMinScore
      });
      setResults(response.evidence);
      setSummary(response.answer);
      setSubmittedQuery(response.question.trim() || normalizedQuery);
      setHasSearched(true);
      setExpandedIds(new Set());
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : 'Unable to search advisory evidence.',
        severity: 'error'
      });
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleRebuild() {
    if (rebuildLoading) {
      return;
    }

    setRebuildLoading(true);
    try {
      await rebuildAdvisoryEvidence();
      setNotification({ message: 'Evidence index rebuilt.', severity: 'success' });
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : 'Unable to rebuild the evidence index.',
        severity: 'error'
      });
    } finally {
      setRebuildLoading(false);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Stack spacing={2.5} sx={{ flex: 1 }}>
      <Stack spacing={0.75}>
        <WorkbenchViewHeader
          title="Advisory Evidence"
          description="Inspect the advisory evidence Buggy has indexed and retrieved."
        />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          🐞 Buggy keeps the receipts here.
        </Typography>
      </Stack>

      <EvidenceSearchForm
        query={query}
        maxResults={maxResults}
        minScore={minScore}
        searchLoading={searchLoading}
        rebuildLoading={rebuildLoading}
        onQueryChange={setQuery}
        onMaxResultsChange={setMaxResults}
        onMinScoreChange={setMinScore}
        onSearch={handleSearch}
        onRebuild={handleRebuild}
      />

      <Stack spacing={1} component="section" aria-labelledby="suggested-evidence-queries">
        <Typography id="suggested-evidence-queries" variant="subtitle2" fontWeight={700}>
          Suggested queries
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {SUGGESTED_QUERIES.map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              variant="outlined"
              onClick={() => setQuery(suggestion)}
              sx={{ height: 'auto', '& .MuiChip-label': { py: 0.75, whiteSpace: 'normal' } }}
            />
          ))}
        </Stack>
      </Stack>

      <Stack
        spacing={1.5}
        component="section"
        aria-label="Advisory evidence results"
        aria-busy={searchLoading}
      >
        {searchLoading ? (
          <Stack spacing={0.75} role="status" aria-live="polite">
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              🐞 Buggy is digging through advisory evidence...
            </Typography>
            <LinearProgress />
          </Stack>
        ) : null}

        <EvidenceResults
          results={results}
          summary={summary}
          submittedQuery={submittedQuery}
          hasSearched={hasSearched}
          expandedIds={expandedIds}
          onToggleExpanded={toggleExpanded}
          onCopySuccess={() => setNotification({ message: 'Evidence copied', severity: 'success' })}
          onCopyError={(message) => setNotification({ message, severity: 'error' })}
        />
      </Stack>

      <Snackbar
        open={notification !== null}
        autoHideDuration={4500}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notification?.severity ?? 'success'}
          variant="filled"
          onClose={() => setNotification(null)}
          sx={{ whiteSpace: 'pre-wrap' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

function clampedNumber(
  value: string,
  fallback: number,
  minimum: number,
  maximum: number,
  integer = false
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = integer ? Math.trunc(parsed) : parsed;
  return Math.min(maximum, Math.max(minimum, normalized));
}
