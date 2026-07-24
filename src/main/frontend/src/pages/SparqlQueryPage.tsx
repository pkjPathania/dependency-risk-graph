import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
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
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SyntheticEvent,
  type UIEvent
} from 'react';
import { executeSparqlQuery, formatSparqlQuery } from '../api/sparqlApi';
import type { SparqlSelectResponse } from '../api/types';
import { RestCallProgress } from '../components/RestCallProgress';
import {
  applySparqlCompletion,
  sparqlCompletions
} from '../features/sparql/autocomplete';
import { completeBracket } from '../features/sparql/bracketCompletion';
import {
  applySparqlPrefixPreset,
  DEFAULT_SPARQL_QUERY,
  SPARQL_PREFIX_PRESETS,
  type SparqlPrefixPresetId
} from '../features/sparql/prefixPresets';
import { downloadSparqlResultsCsv } from '../features/sparql/csvExport';

const EXAMPLE_QUERIES = [
  {
    label: 'All triples',
    query: DEFAULT_SPARQL_QUERY
  },
  {
    label: 'Applications',
    query: `PREFIX  risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

SELECT  ?application ?name ?version ?purl
WHERE
  { ?application  a  risk:ApplicationOccurrence
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
    query: `PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>

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
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionCursor, setCompletionCursor] = useState<number | null>(null);
  const [selectedCompletionIndex, setSelectedCompletionIndex] = useState(0);
  const [completionAnchor, setCompletionAnchor] = useState({ left: 8, top: 8 });
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  const completions = useMemo(
    () => completionCursor === null ? [] : sparqlCompletions(query, completionCursor),
    [completionCursor, query]
  );
  const visibleCompletions = completionOpen ? completions : [];

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
    setCompletionOpen(false);
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const editor = event.currentTarget;
    if (visibleCompletions.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        setSelectedCompletionIndex((current) =>
          (current + direction + visibleCompletions.length) % visibleCompletions.length
        );
        return;
      }
      if (event.key === 'Tab' || event.key === 'Enter') {
        event.preventDefault();
        applyCompletion(
          visibleCompletions[selectedCompletionIndex] ?? visibleCompletions[0],
          editor.selectionStart
        );
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setCompletionOpen(false);
        return;
      }
    }

    const edit = completeBracket(
      editor.value,
      editor.selectionStart,
      editor.selectionEnd,
      event.key
    );
    if (!edit) {
      return;
    }

    event.preventDefault();
    onQueryChange(edit.value);
    setCompletionOpen(false);
    requestAnimationFrame(() => {
      editor.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  }

  function handleEditorChange(value: string, cursorOffset: number) {
    onQueryChange(value);
    setCompletionCursor(cursorOffset);
    setSelectedCompletionIndex(0);
    setCompletionOpen(true);
    if (editorRef.current) {
      updateCompletionAnchor(editorRef.current);
    }
  }

  function handleEditorSelection(editor: HTMLTextAreaElement) {
    setCompletionCursor(editor.selectionStart);
    setSelectedCompletionIndex(0);
    setCompletionOpen(true);
    updateCompletionAnchor(editor);
  }

  function updateCompletionAnchor(editor: HTMLTextAreaElement) {
    const container = editorContainerRef.current;
    if (!container) {
      return;
    }
    setCompletionAnchor(caretPopupPosition(editor, container, editor.selectionStart));
  }

  function applyCompletion(
    completion: { label: string },
    cursorOffset = completionCursor
  ) {
    if (cursorOffset === null) {
      return;
    }
    const edit = applySparqlCompletion(query, cursorOffset, completion.label);
    onQueryChange(edit.value);
    setCompletionOpen(false);
    setCompletionCursor(edit.cursorOffset);
    requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(edit.cursorOffset, edit.cursorOffset);
    });
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

  function handleDownloadResults() {
    if (!execResult || execResult.columns.length === 0) {
      return;
    }

    try {
      downloadSparqlResultsCsv(execResult);
    } catch (error) {
      setPopupError(error instanceof Error ? error.message : 'CSV download failed.');
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
            {isFormatting ? <LinearProgress aria-label="Formatting SPARQL query" /> : null}
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

                <Box ref={editorContainerRef} sx={{ position: 'relative' }}>
                  <TextField
                    value={query}
                    onChange={(event) =>
                      handleEditorChange(
                        event.target.value,
                        event.target.selectionStart ?? event.target.value.length
                      )
                    }
                    multiline
                    minRows={18}
                    fullWidth
                    spellCheck={false}
                    inputRef={editorRef}
                    placeholder="PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>"
                    inputProps={{
                      onKeyDown: handleEditorKeyDown,
                      onSelect: (event: SyntheticEvent<HTMLTextAreaElement>) =>
                        handleEditorSelection(event.currentTarget),
                      onScroll: (event: UIEvent<HTMLTextAreaElement>) =>
                        updateCompletionAnchor(event.currentTarget),
                      style: {
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '0.9rem',
                        lineHeight: 1.6
                      }
                    }}
                  />
                  {visibleCompletions.length > 0 ? (
                    <Paper
                      variant="outlined"
                      role="listbox"
                      aria-label="SPARQL editor suggestions"
                      sx={{
                        position: 'absolute',
                        zIndex: 5,
                        top: completionAnchor.top,
                        left: completionAnchor.left,
                        width: 'max-content',
                        maxWidth: 'calc(100% - 16px)',
                        p: 0.75,
                        boxShadow: 2
                      }}
                    >
                      <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                        {visibleCompletions.map((completion, index) => (
                          <Button
                            key={`${completion.source}-${completion.label}`}
                            role="option"
                            aria-selected={index === selectedCompletionIndex}
                            size="small"
                            variant={index === selectedCompletionIndex ? 'contained' : 'text'}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyCompletion(completion)}
                            sx={{ minWidth: 0, px: 1, py: 0.35 }}
                          >
                            {completion.label}
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ ml: 0.75, opacity: 0.7, textTransform: 'none' }}
                            >
                              {completion.source}
                            </Typography>
                          </Button>
                        ))}
                      </Stack>
                    </Paper>
                  ) : null}
                </Box>

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
            {isExecuting ? <LinearProgress aria-label="Executing SPARQL query" /> : null}
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
                            bgcolor: 'background.paper',
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
                    <Tooltip title="Download table data as CSV with column headers">
                      <span>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
                          onClick={handleDownloadResults}
                          disabled={!execResult || execResult.columns.length === 0}
                        >
                          Download CSV
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
                      bgcolor: 'background.paper'
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

function caretPopupPosition(
  editor: HTMLTextAreaElement,
  container: HTMLDivElement,
  cursorOffset: number
): { left: number; top: number } {
  const computed = window.getComputedStyle(editor);
  const mirror = document.createElement('div');
  const copiedProperties = [
    'box-sizing',
    'font-family',
    'font-size',
    'font-style',
    'font-weight',
    'letter-spacing',
    'line-height',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width'
  ];
  copiedProperties.forEach((property) => {
    mirror.style.setProperty(property, computed.getPropertyValue(property));
  });
  Object.assign(mirror.style, {
    position: 'fixed',
    visibility: 'hidden',
    left: '-9999px',
    top: '0',
    width: `${editor.getBoundingClientRect().width}px`,
    height: 'auto',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word'
  });

  mirror.textContent = editor.value.slice(0, cursorOffset);
  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const editorRect = editor.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const lineHeight = Number.parseFloat(computed.lineHeight) || 22;
  const rawLeft =
    editorRect.left - containerRect.left + marker.offsetLeft - editor.scrollLeft;
  const rawTop =
    editorRect.top -
    containerRect.top +
    marker.offsetTop -
    editor.scrollTop +
    lineHeight +
    4;
  const popupWidth = Math.min(520, Math.max(240, container.clientWidth - 16));
  const left = Math.max(8, Math.min(rawLeft, container.clientWidth - popupWidth - 8));

  mirror.remove();
  return { left, top: Math.max(8, rawTop) };
}
