import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  CveImpactDetailResponse,
  CveImpactListResponse,
  CveImpactScope,
  ImpactGraphNode
} from '../../api/types';
import { severityColors, type Severity } from '../../types/severity';
import { fetchCveImpactDetail } from './exploreApi';
import { CveImpactGraph } from './CveImpactGraph';
import { ExploreEmptyState } from './ExploreEmptyState';
import { referenceLabel } from './ReferencesView';

interface CveImpactViewProps {
  applicationIri: string;
  scope: CveImpactScope;
  response: CveImpactListResponse | null;
  loading: boolean;
  error: string | null;
  onScopeChange: (scope: CveImpactScope) => void;
  onRefresh: () => void;
  onOpenEnrichment: () => void;
}

export function CveImpactView({
  applicationIri,
  scope,
  response,
  loading,
  error,
  onScopeChange,
  onRefresh,
  onOpenEnrichment
}: CveImpactViewProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedVulnerabilityIri, setSelectedVulnerabilityIri] = useState<string | null>(null);
  const [detail, setDetail] = useState<CveImpactDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailReload, setDetailReload] = useState(0);

  const items = response?.items ?? [];
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchingItems = query ? items.filter((item) => [
      item.preferredIdentifier,
      item.osvId,
      item.summary,
      ...item.aliases,
      ...item.applicationNames,
      ...item.packageNames
    ].some((value) => value?.toLowerCase().includes(query))) : items;
    return [...matchingItems].sort((left, right) =>
      right.affectedApplicationCount - left.affectedApplicationCount
      || left.preferredIdentifier.localeCompare(right.preferredIdentifier, undefined, { sensitivity: 'base' })
      || left.osvId.localeCompare(right.osvId, undefined, { sensitivity: 'base' })
    );
  }, [items, search]);
  const pagedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  useEffect(() => {
    setSelectedVulnerabilityIri(null);
    setDetail(null);
    setPage(0);
  }, [applicationIri]);

  useEffect(() => {
    if (!selectedVulnerabilityIri) return;
    let active = true;
    setDetailLoading(true);
    setDetailError(null);
    void fetchCveImpactDetail(selectedVulnerabilityIri, scope, applicationIri)
      .then((nextDetail) => {
        if (active) setDetail(nextDetail);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setDetail(null);
          setDetailError(loadError instanceof Error ? loadError.message : 'Unable to load CVE impact data.');
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => { active = false; };
  }, [applicationIri, detailReload, scope, selectedVulnerabilityIri]);

  if (selectedVulnerabilityIri) {
    return (
      <ImpactDetail
        detail={detail}
        loading={detailLoading}
        error={detailError}
        scope={scope}
        onBack={() => setSelectedVulnerabilityIri(null)}
        onRetry={() => setDetailReload((current) => current + 1)}
        onScopeChange={onScopeChange}
      />
    );
  }

  if (loading) {
    return <CenteredProgress label="Loading CVE impact data" />;
  }
  if (error) {
    return <Alert severity="error" action={<Button onClick={onRefresh}>Retry</Button>}>Unable to load CVE impact data.</Alert>;
  }
  if (items.length === 0) {
    return (
      <Stack spacing={1.25}>
        <ScopeSelect scope={scope} onChange={onScopeChange} />
        <ExploreEmptyState title="CVE Impact" message="Run OSV enrichment to discover vulnerabilities for this application." />
        <Box><Button variant="contained" onClick={onOpenEnrichment}>Open Vulnerability Enrichment</Button></Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} justifyContent="space-between">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1 }}>
          <TextField
            size="small"
            placeholder="Search CVE, advisory, package, or application"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(0); }}
            inputProps={{ 'aria-label': 'Search CVE impact' }}
            sx={{ width: { sm: 380 } }}
          />
          <ScopeSelect scope={scope} onChange={onScopeChange} />
        </Stack>
        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
          <Chip size="small" variant="outlined" label={filteredItems.length.toLocaleString()} />
          <Button size="small" variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={onRefresh}>Refresh</Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="CVE impact vulnerabilities">
          <TableHead><TableRow>
            <TableCell>Identifier</TableCell><TableCell>OSV ID</TableCell><TableCell>Summary</TableCell>
            <TableCell>Severity</TableCell><TableCell align="right">Affected applications</TableCell>
            <TableCell align="right">Package versions</TableCell><TableCell align="right">References</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {pagedItems.map((item) => (
              <TableRow
                hover
                key={item.vulnerabilityIri}
                tabIndex={0}
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelectedVulnerabilityIri(item.vulnerabilityIri)}
                onKeyDown={(event) => { if (event.key === 'Enter') setSelectedVulnerabilityIri(item.vulnerabilityIri); }}
              >
                <TableCell><Typography fontWeight={900} variant="body2">{item.preferredIdentifier}</Typography></TableCell>
                <TableCell>{item.osvId}</TableCell>
                <TableCell sx={{ minWidth: 260, maxWidth: 440 }}>{item.summary || 'No summary provided'}</TableCell>
                <TableCell><SeverityChip value={item.severityLevel} /></TableCell>
                <TableCell align="right">{item.affectedApplicationCount.toLocaleString()}</TableCell>
                <TableCell align="right">{item.affectedPackageVersionCount.toLocaleString()}</TableCell>
                <TableCell align="right">{item.referenceCount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {filteredItems.length === 0 ? <Typography color="text.secondary">No vulnerabilities match the current search.</Typography> : null}
      <TablePagination
        component="div" count={filteredItems.length} page={Math.min(page, Math.max(0, Math.ceil(filteredItems.length / rowsPerPage) - 1))}
        onPageChange={(_, next) => setPage(next)} rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
        rowsPerPageOptions={[25, 50, 100]}
      />
    </Stack>
  );
}

function ImpactDetail({
  detail, loading, error, scope, onBack, onRetry, onScopeChange
}: {
  detail: CveImpactDetailResponse | null;
  loading: boolean;
  error: string | null;
  scope: CveImpactScope;
  onBack: () => void;
  onRetry: () => void;
  onScopeChange: (scope: CveImpactScope) => void;
}) {
  const [selectedExposureId, setSelectedExposureId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState<ImpactGraphNode | null>(null);
  if (loading) return <CenteredProgress label="Loading CVE impact graph" />;
  if (error || !detail) {
    return <Stack spacing={1}><Button startIcon={<ArrowBackOutlinedIcon />} onClick={onBack} sx={{ alignSelf: 'flex-start' }}>Back to CVE list</Button><Alert severity="error" action={<Button onClick={onRetry}>Retry</Button>}>Unable to load CVE impact data.</Alert></Stack>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <Stack direction="row" spacing={1.25} alignItems="center" useFlexGap flexWrap="wrap">
          <Button size="small" startIcon={<ArrowBackOutlinedIcon />} onClick={onBack}>Back to CVE list</Button>
          <Divider orientation="vertical" flexItem />
          <Box><Typography variant="h5" fontWeight={950}>{detail.vulnerability.preferredIdentifier}</Typography><Typography variant="caption" color="text.secondary">{detail.vulnerability.osvId}</Typography></Box>
          <SeverityChip value={detail.vulnerability.severityLevel} />
        </Stack>
        <ScopeSelect scope={scope} onChange={onScopeChange} />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 2.2fr) minmax(320px, 0.8fr)' }, gap: 1.5 }}>
        <CveImpactGraph graph={detail.graph} selectedExposureId={selectedExposureId} onSelectExposure={setSelectedExposureId} onSelectNode={(node) => { setSelectedNode(node); if (node.nodeType === 'VULNERABILITY') setDetailTab(0); }} />
        <ImpactDetailsPanel detail={detail} selectedNode={selectedNode} tab={detailTab} onTabChange={setDetailTab} />
      </Box>

      <Paper variant="outlined">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }}>
          <Typography variant="h6" fontWeight={900}>Affected applications</Typography>
          {selectedExposureId ? <Button size="small" onClick={() => setSelectedExposureId(null)}>Show all paths</Button> : null}
        </Stack>
        <TableContainer><Table size="small" aria-label="Affected application exposures"><TableHead><TableRow>
          <TableCell>Application</TableCell><TableCell>Affected package</TableCell><TableCell>Installed version</TableCell>
          <TableCell>Dependency type</TableCell><TableCell align="right">Path length</TableCell><TableCell align="right">Action</TableCell>
        </TableRow></TableHead><TableBody>
          {detail.exposures.map((exposure) => <TableRow key={exposure.exposureId} selected={selectedExposureId === exposure.exposureId}>
            <TableCell>{exposure.application.name}</TableCell><TableCell>{exposure.vulnerablePackage.name}</TableCell>
            <TableCell>{exposure.vulnerablePackage.version || '—'}</TableCell><TableCell><Chip size="small" variant="outlined" label={exposure.dependencyType} /></TableCell>
            <TableCell align="right">{isResolvedPath(exposure.pathStatus) ? exposure.dependencyHops : '—'}</TableCell>
            <TableCell align="right"><Button size="small" disabled={!isResolvedPath(exposure.pathStatus)} onClick={() => setSelectedExposureId(exposure.exposureId)}>View path</Button></TableCell>
          </TableRow>)}
        </TableBody></Table></TableContainer>
      </Paper>
    </Stack>
  );
}

function isResolvedPath(status: string): boolean {
  return status === 'AFFECTED_PATH_RESOLVED' || status === 'AVAILABLE';
}

function ImpactDetailsPanel({ detail, selectedNode, tab, onTabChange }: { detail: CveImpactDetailResponse; selectedNode: ImpactGraphNode | null; tab: number; onTabChange: (value: number) => void }) {
  return <Paper variant="outlined" sx={{ p: 1.5, minHeight: 480, overflow: 'auto' }}>
    {selectedNode ? <Alert severity="info" sx={{ mb: 1.5 }}><strong>{selectedNode.label}</strong>{selectedNode.version ? ` ${selectedNode.version}` : ''}<br />{nodeContext(selectedNode)}</Alert> : null}
    <Tabs value={tab} onChange={(_, value: number) => onTabChange(value)} variant="fullWidth"><Tab label="Details" /><Tab label="CVSS" /><Tab label="References" /></Tabs>
    <Divider sx={{ mb: 1.5 }} />
    {tab === 0 ? <Stack spacing={1.5}>
      <Detail label="Summary" value={detail.vulnerability.summary} />
      <AdvisoryDetails value={detail.vulnerability.details} />
      <Detail label="Severity" value={detail.vulnerability.severityLevel || 'UNRATED'} /><Detail label="Published" value={formatDate(detail.vulnerability.publishedAt)} />
      <Detail label="Modified" value={formatDate(detail.vulnerability.modifiedAt)} />
      <Detail label="Affected package versions" value={distinctPackageVersions(detail).join('\n')} pre />
      <Detail label="Fixed versions" value={detail.fixedVersions.length ? detail.fixedVersions.map((fixed) => `${fixed.packageName ?? 'Package'} ${fixed.version}${fixed.purl ? `\n${fixed.purl}` : ''}`).join('\n\n') : 'No fixed version listed'} pre />
    </Stack> : null}
    {tab === 1 ? <Stack spacing={1.5}>{detail.cvssAssessments.length ? detail.cvssAssessments.map((assessment) => <Box key={assessment.iri ?? assessment.vector}><Typography fontWeight={900}>CVSS {assessment.version ?? assessment.type ?? ''}</Typography><Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{assessment.vector}</Typography></Box>) : <Typography color="text.secondary">No CVSS assessment listed.</Typography>}</Stack> : null}
    {tab === 2 ? <Stack spacing={1}>{detail.referenceUrls.length ? detail.referenceUrls.map((url) => <ExternalReference key={url} value={url} />) : <Typography color="text.secondary">No references listed.</Typography>}</Stack> : null}
  </Paper>;
}

function ScopeSelect({ scope, onChange }: { scope: CveImpactScope; onChange: (scope: CveImpactScope) => void }) {
  return <FormControl size="small" sx={{ minWidth: 190 }}><InputLabel id="cve-impact-scope-label">Scope</InputLabel><Select labelId="cve-impact-scope-label" label="Scope" value={scope} onChange={(event) => onChange(event.target.value as CveImpactScope)}><MenuItem value="selected">Selected application</MenuItem><MenuItem value="all">All applications</MenuItem></Select></FormControl>;
}

function SeverityChip({ value }: { value: string | null }) {
  const severity = value?.trim().toUpperCase() || 'UNRATED';
  const tone = severityColors[toSeverityTone(severity)];
  return <Chip size="small" label={severity} variant="outlined" sx={{ bgcolor: tone.light, color: tone.dark, borderColor: tone.main }} />;
}

function toSeverityTone(value: string): Severity {
  if (value === 'CRITICAL' || value === 'HIGH' || value === 'LOW') return value;
  if (value === 'MEDIUM' || value === 'MODERATE') return 'MEDIUM';
  return 'UNKNOWN';
}

function ExternalReference({ value }: { value: string }) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL');
    return <Paper variant="outlined" sx={{ p: 1 }}>
      <Link href={value} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ display: 'flex', gap: 0.5, alignItems: 'center', fontWeight: 800 }}>
        {referenceLabel(value)}<LaunchOutlinedIcon fontSize="inherit" />
      </Link>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Paper>;
  } catch {
    return <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{value}</Typography>;
  }
}

function AdvisoryDetails({ value }: { value: string | null }) {
  if (!value?.trim()) return <Detail label="Advisory details" value={null} />;
  return <Box>
    <Typography variant="overline" fontWeight={900}>Advisory details</Typography>
    <Stack spacing={0.75} sx={{ mt: 0.25 }}>
      {value.split(/\r?\n/).map((line, index) => {
        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
          return <Typography key={index} variant={heading[1].length <= 2 ? 'subtitle1' : 'subtitle2'} fontWeight={900} sx={{ pt: index ? 0.75 : 0 }}>
            {renderInlineContent(heading[2])}
          </Typography>;
        }
        const bullet = line.match(/^\s*[-*]\s+(.+)$/);
        if (bullet) {
          return <Stack key={index} direction="row" spacing={0.75} alignItems="flex-start">
            <Typography component="span" aria-hidden>•</Typography>
            <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{renderInlineContent(bullet[1])}</Typography>
          </Stack>;
        }
        if (!line.trim()) return <Box key={index} sx={{ height: 4 }} />;
        return <Typography key={index} variant="body2" sx={{ overflowWrap: 'anywhere' }}>{renderInlineContent(line)}</Typography>;
      })}
    </Stack>
  </Box>;
}

function renderInlineContent(value: string): ReactNode[] {
  const content: ReactNode[] = [];
  const pattern = /\[([^\]]+)]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<]+)/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    const offset = match.index ?? 0;
    if (offset > cursor) content.push(value.slice(cursor, offset));
    const url = match[2] ?? match[3];
    content.push(<Link key={`${offset}:${url}`} href={url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>{match[1] ?? url}</Link>);
    cursor = offset + match[0].length;
  }
  if (cursor < value.length) content.push(value.slice(cursor));
  return content;
}

function Detail({ label, value, pre = false }: { label: string; value: string | null; pre?: boolean }) {
  return <Box><Typography variant="overline" fontWeight={900}>{label}</Typography><Typography variant="body2" sx={{ whiteSpace: pre ? 'pre-wrap' : 'normal', overflowWrap: 'anywhere' }}>{value || '—'}</Typography></Box>;
}

function CenteredProgress({ label }: { label: string }) { return <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label={label} /></Box>; }
function formatDate(value: string | null): string { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
function distinctPackageVersions(detail: CveImpactDetailResponse): string[] { return Array.from(new Set(detail.exposures.map((exposure) => `${exposure.vulnerablePackage.name} ${exposure.vulnerablePackage.version ?? ''}`.trim()))); }
function nodeContext(node: ImpactGraphNode): string {
  if (node.nodeType === 'APPLICATION') return `${node.metadata.exposureCount ?? 0} matching paths`;
  if (node.nodeType === 'DEPENDENCY' || node.nodeType === 'VULNERABLE_PACKAGE') {
    const applications = Array.isArray(node.metadata.applications) ? node.metadata.applications.join(', ') : 'No application context';
    const purl = typeof node.metadata.purl === 'string' && node.metadata.purl ? ` · ${node.metadata.purl}` : '';
    return `${applications}${purl}`;
  }
  if (node.nodeType === 'FIXED_VERSION') return typeof node.metadata.purl === 'string' && node.metadata.purl ? node.metadata.purl : 'Fixed package version';
  return `${node.metadata.severity ?? 'UNRATED'} · ${node.metadata.affectedApplicationCount ?? 0} applications`;
}
