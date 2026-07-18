import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import type {
  ApplicationVulnerabilitiesResponse,
  ApplicationVulnerabilityItem,
  FixedVersionView
} from '../../api/types';
import { ExploreEmptyState } from './ExploreEmptyState';

interface VulnerabilitiesViewProps {
  response: ApplicationVulnerabilitiesResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenEnrichment: () => void;
}

export function VulnerabilitiesView({
  response,
  loading,
  error,
  onRefresh,
  onOpenEnrichment
}: VulnerabilitiesViewProps) {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [dependencyType, setDependencyType] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedItem, setSelectedItem] = useState<ApplicationVulnerabilityItem | null>(null);

  const items = response?.items ?? [];
  const severityOptions = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => normalizedSeverity(item.severityLevel)))
      ).sort(),
    [items]
  );
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (severity !== 'ALL' && normalizedSeverity(item.severityLevel) !== severity) {
        return false;
      }
      if (dependencyType !== 'ALL' && item.dependencyType !== dependencyType) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [
        item.packageName,
        item.installedVersion,
        item.osvId,
        item.summary,
        ...item.aliases
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [dependencyType, items, search, severity]);
  const pagedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  if (loading) {
    return (
      <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Loading vulnerabilities" size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button onClick={onRefresh}>Retry</Button>}
      >
        {error}
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <Stack spacing={1.25}>
        <ExploreEmptyState
          title="Vulnerabilities"
          message="Run OSV enrichment to populate vulnerability data."
        />
        <Box>
          <Button variant="contained" onClick={onOpenEnrichment}>
            Open Vulnerability Enrichment
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ flex: 1 }}>
          <TextField
            size="small"
            placeholder="Search package, version, advisory, or summary"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            inputProps={{ 'aria-label': 'Search vulnerabilities' }}
            sx={{ flex: 1, minWidth: 220, maxWidth: { md: 360 } }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="severity-filter-label">Severity</InputLabel>
            <Select
              labelId="severity-filter-label"
              label="Severity"
              value={severity}
              onChange={(event) => {
                setSeverity(event.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All severities</MenuItem>
              {severityOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="dependency-filter-label">Dependency</InputLabel>
            <Select
              labelId="dependency-filter-label"
              label="Dependency"
              value={dependencyType}
              onChange={(event) => {
                setDependencyType(event.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All dependencies</MenuItem>
              <MenuItem value="DIRECT">Direct</MenuItem>
              <MenuItem value="TRANSITIVE">Transitive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
          <Chip size="small" label={filteredItems.length.toLocaleString()} variant="outlined" />
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshOutlinedIcon fontSize="small" />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small" aria-label="Application vulnerabilities">
          <TableHead>
            <TableRow>
              <TableCell>Package</TableCell>
              <TableCell>Installed</TableCell>
              <TableCell>Dependency</TableCell>
              <TableCell>Advisory</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>CVSS</TableCell>
              <TableCell>Fixed versions</TableCell>
              <TableCell>Published</TableCell>
              <TableCell align="right">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedItems.map((item) => (
              <TableRow key={`${item.packageIri}\u0000${item.vulnerabilityIri}`} hover>
                <TableCell sx={{ minWidth: 190, maxWidth: 260 }}>
                  <Typography variant="body2" fontWeight={800}>{item.packageName}</Typography>
                  <EllipsizedValue value={item.installedPurl} />
                </TableCell>
                <TableCell>{item.installedVersion || '—'}</TableCell>
                <TableCell>
                  <Chip size="small" label={item.dependencyType} variant="outlined" />
                </TableCell>
                <TableCell sx={{ minWidth: 220, maxWidth: 340 }}>
                  <Typography variant="body2" fontWeight={800}>{displayAdvisoryId(item)}</Typography>
                  {displayAdvisoryId(item) !== item.osvId ? (
                    <Typography variant="caption" color="text.secondary">{item.osvId}</Typography>
                  ) : null}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {item.summary || 'No summary provided'}
                  </Typography>
                </TableCell>
                <TableCell><SeverityChip value={item.severityLevel} /></TableCell>
                <TableCell><CvssChips item={item} /></TableCell>
                <TableCell sx={{ minWidth: 180 }}><FixedVersionChips versions={item.fixedVersions} /></TableCell>
                <TableCell>{formatDate(item.publishedAt)}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setSelectedItem(item)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No vulnerabilities match the current filters.</Typography>
      ) : null}

      <TablePagination
        component="div"
        count={filteredItems.length}
        page={Math.min(page, Math.max(0, Math.ceil(filteredItems.length / rowsPerPage) - 1))}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[25, 50, 100]}
      />

      <VulnerabilityDetailsDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
    </Stack>
  );
}

function EllipsizedValue({ value }: { value: string | null }) {
  return (
    <Tooltip title={value || 'No PURL available'}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {value || '—'}
      </Typography>
    </Tooltip>
  );
}

function SeverityChip({ value }: { value: string | null }) {
  const severity = normalizedSeverity(value);
  const color =
    severity === 'CRITICAL' ? 'error' :
      severity === 'HIGH' ? 'warning' :
        severity === 'MODERATE' ? 'info' :
          severity === 'LOW' ? 'success' : 'default';
  return <Chip size="small" label={severity} color={color} variant={severity === 'UNRATED' ? 'outlined' : 'filled'} />;
}

function CvssChips({ item }: { item: ApplicationVulnerabilityItem }) {
  if (item.cvssAssessments.length === 0) {
    return <>—</>;
  }
  return (
    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
      {item.cvssAssessments.map((assessment) => (
        <Tooltip key={`${assessment.type}:${assessment.vector}`} title={assessment.vector}>
          <Chip size="small" label={assessment.version || assessment.type || 'CVSS'} variant="outlined" />
        </Tooltip>
      ))}
    </Stack>
  );
}

function FixedVersionChips({ versions }: { versions: FixedVersionView[] }) {
  if (versions.length === 0) {
    return <Typography variant="caption" color="text.secondary">No fixed version listed</Typography>;
  }
  return (
    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
      {versions.map((fixed) => (
        <Tooltip key={`${fixed.packageName}:${fixed.version}:${fixed.purl}`} title={fixed.purl || fixed.packageName || ''}>
          <Chip size="small" label={fixed.version} variant="outlined" />
        </Tooltip>
      ))}
    </Stack>
  );
}

function VulnerabilityDetailsDialog({
  item,
  onClose
}: {
  item: ApplicationVulnerabilityItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(item)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Vulnerability details</DialogTitle>
      <DialogContent dividers>
        {item ? (
          <Stack spacing={2}>
            <Detail label="Package" value={item.packageName} />
            <Detail label="Installed version" value={item.installedVersion} />
            <Detail label="Installed PURL" value={item.installedPurl} />
            <Detail label="OSV ID" value={item.osvId} />
            <Detail label="Aliases" value={item.aliases.join(', ')} />
            <Detail label="Summary" value={item.summary} />
            <Detail label="Details" value={item.details} preWrap />
            <Detail label="Severity" value={normalizedSeverity(item.severityLevel)} />
            <Detail
              label="CVSS assessments"
              value={item.cvssAssessments.map((assessment) => `${assessment.version || assessment.type || 'CVSS'}: ${assessment.vector}`).join('\n')}
              preWrap
            />
            <Detail
              label="Fixed versions"
              value={item.fixedVersions.map((fixed) => `${fixed.packageName || item.packageName} ${fixed.version}${fixed.purl ? `\n${fixed.purl}` : ''}`).join('\n\n')}
              preWrap
            />
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>REFERENCES</Typography>
              {item.referenceUrls.length === 0 ? <Typography variant="body2">—</Typography> : item.referenceUrls.map((url) => (
                <Link key={url} href={url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>
                  {url}
                </Link>
              ))}
            </Stack>
            <Detail label="Published" value={formatDateTime(item.publishedAt)} />
            <Detail label="Modified" value={formatDateTime(item.modifiedAt)} />
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

function Detail({ label, value, preWrap = false }: { label: string; value: string | null; preWrap?: boolean }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>{label.toUpperCase()}</Typography>
      <Typography variant="body2" sx={{ whiteSpace: preWrap ? 'pre-wrap' : 'normal', overflowWrap: 'anywhere' }}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}

function displayAdvisoryId(item: ApplicationVulnerabilityItem): string {
  return item.aliases.find((alias) => alias.toUpperCase().startsWith('CVE-')) || item.osvId;
}

function normalizedSeverity(value: string | null): string {
  return value?.trim().toUpperCase() || 'UNRATED';
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}
