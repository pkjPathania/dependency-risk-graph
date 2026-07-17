import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  TextField,
  Snackbar,
  Tooltip,
  Typography
} from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useMemo, useState } from 'react';
import { executeSparqlQuery, formatSparqlQuery } from '../api/sparqlApi';
import type { SparqlSelectResponse } from '../api/types';
import { RestCallProgress } from '../components/RestCallProgress';
import {
  applySparqlPrefixPreset,
  DEFAULT_SPARQL_QUERY,
  SPARQL_PREFIX_PRESETS,
  type SparqlPrefixPresetId
} from '../features/sparql/prefixPresets';

const EXAMPLE_QUERIES = [
  {
    label: 'All triples',
    query: DEFAULT_SPARQL_QUERY
  },
  {
    label: 'Applications',
    query: `PREFIX  risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>

SELECT  ?application ?name ?version ?purl
WHERE
  { ?application  a  risk:Application
    OPTIONAL
      { ?application  risk:name  ?name }
    OPTIONAL
      { ?application  risk:version  ?version }
    OPTIONAL
      { ?application  risk:purl  ?purl }
  }`
  },
  {
    label: 'Dependency edges',
    query: `PREFIX risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>

SELECT ?source ?target
WHERE {
  ?source risk:dependsOn ?target .
}
LIMIT 50`
  }
] as const;

interface SparqlQueryPageProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function SparqlQueryPage({ query, onQueryChange }: SparqlQueryPageProps) {
  const [isFormatting, setIsFormatting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<SparqlSelectResponse | null>(null);
  const [popupError, setPopupError] = useState<string | null>(null);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  function handlePrefixPresetSelect(presetId: SparqlPrefixPresetId) {
    onQueryChange(applySparqlPrefixPreset(query, presetId));
  }

  async function handleFormatQuery() {
    if (!hasQuery) {
      setPopupError('Enter a SPARQL query before formatting it.');
      return;
    }

    setIsFormatting(true);
    setPopupError(null);

    try {
      const formattedText = await formatSparqlQuery(query);
      onQueryChange(formattedText);
    } catch (error) {
      setPopupError(error instanceof Error ? error.message : 'Formatting failed.');
    } finally {
      setIsFormatting(false);
    }
  }

  function handleExampleSelect(exampleQuery: string) {
    onQueryChange(exampleQuery);
    setPopupError(null);
    setExecResult(null);
  }

  async function handleExecuteQuery() {
    if (!hasQuery) {
      setPopupError('Enter a SPARQL query before executing it.');
      return;
    }

    setIsExecuting(true);
    setPopupError(null);

    try {
      const response = await executeSparqlQuery(query);
      setExecResult(response);
    } catch (error) {
      setPopupError(error instanceof Error ? error.message : 'Execution failed.');
      setExecResult(null);
    } finally {
      setIsExecuting(false);
    }
  }

  async function handleCopyResults() {
    if (!execResult || !navigator.clipboard) {
      return;
    }

    const text = formatResultsForClipboard(execResult);

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      setPopupError(error instanceof Error ? error.message : 'Copy failed.');
    }
  }

  return (
    <Box
      sx={{
        mx: { xs: -1.5, sm: -2.5, md: -3 }
      }}
    >
      <Stack spacing={3}>
        <RestCallProgress visible={isFormatting || isExecuting} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Card sx={{ minWidth: 0 }}>
            <CardContent sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 2, md: 2.5 } }}>
              <Stack spacing={1.75}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  justifyContent="space-between"
                >
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, fontWeight: 800 }}>
                    Query editor
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                    {SPARQL_PREFIX_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outlined"
                        size="small"
                        onClick={() => handlePrefixPresetSelect(preset.id)}
                        sx={compactActionButtonSx}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </Stack>
                </Stack>

                <TextField
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  multiline
                  minRows={18}
                  fullWidth
                  spellCheck={false}
                  placeholder="PREFIX risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>"
                  inputProps={{
                    style: {
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '0.9rem',
                      lineHeight: 1.6
                    }
                  }}
                />

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Button variant="outlined" onClick={handleExecuteQuery} disabled={!hasQuery || isExecuting}>
                      {isExecuting ? 'Executing query' : 'Run query'}
                    </Button>
                    <Button variant="contained" onClick={handleFormatQuery} disabled={!hasQuery || isFormatting}>
                      {isFormatting ? 'Formatting query' : 'Format query'}
                    </Button>
                  </Stack>

                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                    {EXAMPLE_QUERIES.map((example) => (
                      <Button
                        key={example.label}
                        variant="outlined"
                        size="small"
                        onClick={() => handleExampleSelect(example.query)}
                        sx={compactActionButtonSx}
                      >
                        {example.label}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 0 }}>
            <CardContent sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 2, md: 2.5 } }}>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">Query results</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    {execResult ? (
                      <Tooltip title="Rows returned">
                        <Box
                          sx={{
                            minWidth: 44,
                            px: 1.2,
                            py: 0.75,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1 }}>
                            {execResult.rows.length}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : null}
                    <Tooltip title="Copy table data">
                      <span>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                          onClick={handleCopyResults}
                          disabled={!execResult}
                        >
                          Copy
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>

                {execResult ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 560 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {execResult.columns.map((column) => (
                            <TableCell key={column}>{column}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {execResult.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {execResult.columns.map((column) => (
                              <TableCell key={column}>{row[column] ?? '—'}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box
                    sx={{
                      p: 3,
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.default'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Run a SELECT query to see the `/exec` response here.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
      <Snackbar
        open={Boolean(popupError)}
        onClose={() => setPopupError(null)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Alert onClose={() => setPopupError(null)} severity="error" variant="filled" sx={{ whiteSpace: 'pre-wrap' }}>
          {popupError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const compactActionButtonSx = {
  minWidth: 0,
  px: 1,
  py: 0.45,
  textTransform: 'none',
  fontWeight: 700
};

function formatResultsForClipboard(result: SparqlSelectResponse): string {
  if (result.columns.length === 0) {
    return '';
  }

  const header = result.columns.join('\t');
  const rows = result.rows.map((row) =>
    result.columns
      .map((column) => sanitizeClipboardCell(row[column] ?? ''))
      .join('\t')
  );

  return [header, ...rows].join('\n');
}

function sanitizeClipboardCell(value: string): string {
  return value.replaceAll('\t', ' ').replaceAll('\r', ' ').replaceAll('\n', ' ');
}
