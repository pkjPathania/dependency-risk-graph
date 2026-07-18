import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import type {
  AdvisoryReferenceItem,
  ApplicationReferencesResponse
} from '../../api/types';
import { ExploreEmptyState } from './ExploreEmptyState';

export type ReferenceCategory =
  | 'SECURITY_ADVISORY'
  | 'NVD'
  | 'FIX_COMMIT'
  | 'PULL_REQUEST'
  | 'ISSUE'
  | 'VENDOR_ADVISORY'
  | 'PROJECT'
  | 'MAILING_LIST'
  | 'OTHER';

interface ReferencesViewProps {
  response: ApplicationReferencesResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenEnrichment: () => void;
}

const categoryOptions: Array<{ value: 'ALL' | ReferenceCategory; label: string }> = [
  { value: 'ALL', label: 'All categories' },
  { value: 'SECURITY_ADVISORY', label: 'Security advisory' },
  { value: 'NVD', label: 'NVD' },
  { value: 'FIX_COMMIT', label: 'Fix commit' },
  { value: 'PULL_REQUEST', label: 'Pull request' },
  { value: 'ISSUE', label: 'Issue' },
  { value: 'VENDOR_ADVISORY', label: 'Vendor' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'MAILING_LIST', label: 'Mailing list' },
  { value: 'OTHER', label: 'Other' }
];

export function ReferencesView({
  response,
  loading,
  error,
  onRefresh,
  onOpenEnrichment
}: ReferencesViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | ReferenceCategory>('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const items = response?.items ?? [];

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const references = distinctReferences(item.referenceUrls);
      if (category !== 'ALL' && !references.some((url) => classifyReference(url) === category)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [
        item.osvId,
        item.summary,
        ...item.aliases,
        ...item.affectedPackages.flatMap((pkg) => [pkg.packageName, pkg.installedVersion]),
        ...references.map(referenceHostname)
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [category, items, search]);

  const pagedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  if (loading) {
    return (
      <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Loading advisory references" size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={onRefresh}>Retry</Button>}>
        Unable to load advisory references.
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <Stack spacing={1.25}>
        <ExploreEmptyState
          title="References"
          message="Advisory references will appear here after vulnerability enrichment."
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
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1 }}>
          <TextField
            size="small"
            placeholder="Search advisory, package, version, or reference"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            inputProps={{ 'aria-label': 'Search advisory references' }}
            sx={{ flex: 1, minWidth: 240, maxWidth: { sm: 360 } }}
          />
          <FormControl size="small" sx={{ minWidth: 210 }}>
            <InputLabel id="reference-category-label">Reference category</InputLabel>
            <Select
              labelId="reference-category-label"
              label="Reference category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as 'ALL' | ReferenceCategory);
                setPage(0);
              }}
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
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

      <Stack spacing={1}>
        {pagedItems.map((item) => (
          <AdvisoryAccordion key={item.vulnerabilityIri || item.osvId} item={item} />
        ))}
      </Stack>

      {filteredItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No advisory references match the current filters.
        </Typography>
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
        labelRowsPerPage="Advisories per page"
      />
    </Stack>
  );
}

function AdvisoryAccordion({ item }: { item: AdvisoryReferenceItem }) {
  const references = distinctReferences(item.referenceUrls);
  return (
    <Accordion variant="outlined" disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={0.35} sx={{ minWidth: 0, pr: 1 }}>
          <Stack direction="row" spacing={1} alignItems="baseline" useFlexGap flexWrap="wrap">
            <Typography variant="subtitle2" fontWeight={900}>{preferredIdentifier(item)}</Typography>
            {preferredIdentifier(item) !== item.osvId ? (
              <Typography variant="caption" color="text.secondary" fontWeight={700}>{item.osvId}</Typography>
            ) : null}
          </Stack>
          <Typography variant="body2" fontWeight={700}>{item.summary || 'No summary provided'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {countLabel(item.affectedPackages.length, 'affected package')} · {countLabel(references.length, 'reference')}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack spacing={0.75}>
            <Typography variant="overline" fontWeight={900}>Affected package versions</Typography>
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
              {item.affectedPackages.map((pkg) => (
                <Tooltip key={`${pkg.packageIri}:${pkg.installedVersion}`} title={pkg.packageIri}>
                  <Chip size="small" label={`${pkg.packageName} ${pkg.installedVersion}`} variant="outlined" />
                </Tooltip>
              ))}
            </Stack>
          </Stack>
          <ReferenceLinks references={references} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function ReferenceLinks({ references }: { references: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleReferences = showAll ? references : references.slice(0, 10);
  const grouped = groupReferences(visibleReferences);
  return (
    <Stack spacing={1}>
      <Typography variant="overline" fontWeight={900}>References</Typography>
      {grouped.map(([category, urls]) => (
        <Stack key={category} spacing={0.45}>
          <Typography variant="caption" color="text.secondary" fontWeight={900}>
            {categoryLabel(category)}
          </Typography>
          {urls.map((url) => (
            <Tooltip key={url} title={url} placement="top-start">
              <Link href={url} target="_blank" rel="noopener noreferrer" sx={{ width: 'fit-content', maxWidth: '100%' }}>
                {referenceLabel(url)}
              </Link>
            </Tooltip>
          ))}
        </Stack>
      ))}
      {!showAll && references.length > 10 ? (
        <Button size="small" onClick={() => setShowAll(true)} sx={{ alignSelf: 'flex-start' }}>
          Show all references
        </Button>
      ) : null}
    </Stack>
  );
}

export function preferredIdentifier(item: AdvisoryReferenceItem): string {
  return item.aliases.find((alias) => alias.toUpperCase().startsWith('CVE-')) ?? item.osvId;
}

export function classifyReference(value: string): ReferenceCategory {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    if (host === 'github.com' && path.includes('/security/advisories/')) return 'SECURITY_ADVISORY';
    if (host === 'nvd.nist.gov') return 'NVD';
    if (host === 'github.com' && path.includes('/commit/')) return 'FIX_COMMIT';
    if (host === 'github.com' && path.includes('/pull/')) return 'PULL_REQUEST';
    if (host === 'github.com' && path.includes('/issues/')) return 'ISSUE';
    if (host.includes('security.') || host.includes('access.redhat.com') || host.includes('debian.org') || host.includes('oracle.com')) return 'VENDOR_ADVISORY';
    if (host.includes('lists.apache.org') || host.includes('openwall.com') || path.includes('/lists/')) return 'MAILING_LIST';
    if (host === 'github.com') return 'PROJECT';
    return 'OTHER';
  } catch {
    return 'OTHER';
  }
}

export function referenceLabel(value: string): string {
  const category = classifyReference(value);
  switch (category) {
    case 'SECURITY_ADVISORY': return 'GitHub Security Advisory';
    case 'NVD': return 'NVD';
    case 'FIX_COMMIT': return 'Fix commit';
    case 'PULL_REQUEST': return 'Pull request';
    case 'ISSUE': return 'Issue';
    case 'VENDOR_ADVISORY': return 'Vendor advisory';
    case 'PROJECT': return 'Project reference';
    case 'MAILING_LIST': return 'Mailing-list discussion';
    default:
      try {
        return new URL(value).hostname || value;
      } catch {
        return value;
      }
  }
}

function distinctReferences(references: string[]): string[] {
  return Array.from(new Set(references.filter((value) => value.trim()).map((value) => value.trim())));
}

function groupReferences(references: string[]): Array<[ReferenceCategory, string[]]> {
  const grouped = new Map<ReferenceCategory, string[]>();
  for (const reference of references) {
    const category = classifyReference(reference);
    grouped.set(category, [...(grouped.get(category) ?? []), reference]);
  }
  return Array.from(grouped.entries());
}

function categoryLabel(category: ReferenceCategory): string {
  const option = categoryOptions.find((entry) => entry.value === category);
  return option?.label ?? 'Other';
}

function referenceHostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()} ${singular}${count === 1 ? '' : 's'}`;
}
