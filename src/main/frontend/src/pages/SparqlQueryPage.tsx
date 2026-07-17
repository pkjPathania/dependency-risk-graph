import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import { executeSparqlQuery, formatSparqlQuery } from '../api/sparqlApi';
import type { SparqlSelectResponse } from '../api/types';
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
    query: `PREFIX risk: <urn:io.github.pkjpathania.dependencyrisk:schema:>

SELECT ?application ?name ?version
WHERE {
  ?application a risk:Application ;
    risk:name ?name ;
    risk:version ?version .
}
ORDER BY ?name`
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
  const [formatError, setFormatError] = useState<string | null>(null);
  const [execError, setExecError] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<SparqlSelectResponse | null>(null);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  function handlePrefixPresetSelect(presetId: SparqlPrefixPresetId) {
    onQueryChange(applySparqlPrefixPreset(query, presetId));
  }

  async function handleFormatQuery() {
    if (!hasQuery) {
      setFormatError('Enter a SPARQL query before formatting it.');
      return;
    }

    setIsFormatting(true);
    setFormatError(null);

    try {
      const formattedText = await formatSparqlQuery(query);
      onQueryChange(formattedText);
    } catch (error) {
      setFormatError(error instanceof Error ? error.message : 'Formatting failed.');
    } finally {
      setIsFormatting(false);
    }
  }

  function handleExampleSelect(exampleQuery: string) {
    onQueryChange(exampleQuery);
    setFormatError(null);
    setExecError(null);
    setExecResult(null);
  }

  async function handleExecuteQuery() {
    if (!hasQuery) {
      setExecError('Enter a SPARQL query before executing it.');
      return;
    }

    setIsExecuting(true);
    setExecError(null);

    try {
      const response = await executeSparqlQuery(query);
      setExecResult(response);
    } catch (error) {
      setExecError(error instanceof Error ? error.message : 'Execution failed.');
      setExecResult(null);
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <Box
      sx={{
        mx: { xs: -1.5, sm: -2.5, md: -3 }
      }}
    >
      <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.05rem', md: '1.15rem' }, fontWeight: 700 }}>
          Prefix presets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Apply a prefix block to the current query before formatting or execution.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          {SPARQL_PREFIX_PRESETS.map((preset) => (
            <Button key={preset.id} variant="outlined" size="small" onClick={() => handlePrefixPresetSelect(preset.id)}>
              {preset.label}
            </Button>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 2, md: 2.5 } }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h6">Query editor</Typography>
                <Typography variant="body2" color="text.secondary">
                  The SPARQL formatter endpoint returns normalized text and updates this box in place.
                </Typography>
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

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button variant="outlined" onClick={handleExecuteQuery} disabled={!hasQuery || isExecuting}>
                  {isExecuting ? 'Executing query' : 'Run query'}
                </Button>
                <Button variant="contained" onClick={handleFormatQuery} disabled={!hasQuery || isFormatting}>
                  {isFormatting ? 'Formatting query' : 'Format query'}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Format updates the editor. Run fills the results table below.
                </Typography>
              </Stack>

              {formatError ? <Typography color="error">{formatError}</Typography> : null}
              {execError ? <Typography color="error">{execError}</Typography> : null}

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle2">Examples</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {EXAMPLE_QUERIES.map((example) => (
                    <Chip
                      key={example.label}
                      label={example.label}
                      variant="outlined"
                      clickable
                      onClick={() => handleExampleSelect(example.query)}
                    />
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 2, md: 2.5 } }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h6">Query results</Typography>
                <Typography variant="body2" color="text.secondary">
                  This table displays the response returned from <code>/api/v1/sparql/exec</code>.
                </Typography>
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
    </Box>
  );
}
