import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useEffect, useState, type SyntheticEvent } from 'react';
import type { SparqlStatsResponse } from '../../api/types';

const STATS_TABS = [
  { label: 'Op raw', field: 'raw' },
  { label: 'Op optimized', field: 'optimized' },
  { label: 'String rawSse', field: 'rawSse' },
  { label: 'String optimizedSse', field: 'optimizedSse' }
] as const;

interface SparqlStatsDialogProps {
  open: boolean;
  loading: boolean;
  stats: SparqlStatsResponse | null;
  onClose: () => void;
}

export function SparqlStatsDialog({ open, loading, stats, onClose }: SparqlStatsDialogProps) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open) {
      setActiveTab(0);
    }
  }, [open]);

  function handleTabChange(_event: SyntheticEvent, value: number) {
    setActiveTab(value);
  }

  const selectedTab = STATS_TABS[activeTab];
  const content = stats && selectedTab ? displayStatsValue(stats[selectedTab.field]) : '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>SPARQL query statistics</DialogTitle>
      {loading ? <LinearProgress aria-label="Loading SPARQL query statistics" /> : null}
      <DialogContent dividers sx={{ p: 0, minHeight: { xs: 420, md: 560 } }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="SPARQL query statistics views"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {STATS_TABS.map((tab, index) => (
            <Tab
              key={tab.field}
              id={`sparql-stats-tab-${index}`}
              aria-controls={`sparql-stats-panel-${index}`}
              label={tab.label}
            />
          ))}
        </Tabs>

        <Box
          role="tabpanel"
          id={`sparql-stats-panel-${activeTab}`}
          aria-labelledby={`sparql-stats-tab-${activeTab}`}
          sx={{ p: 2 }}
        >
          {loading ? (
            <Typography color="text.secondary">Inspecting ARQ algebra…</Typography>
          ) : (
            <Paper
              component="pre"
              variant="outlined"
              tabIndex={0}
              sx={{
                m: 0,
                p: 2,
                minHeight: { xs: 300, md: 440 },
                maxHeight: '60vh',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.82rem',
                lineHeight: 1.6
              }}
            >
              {content || 'No statistics were returned for this view.'}
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function displayStatsValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
