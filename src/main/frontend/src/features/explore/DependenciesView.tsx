import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';
import type { DependencySummary } from '../../api/types';
import { ExploreDataTable } from './ExploreDataTable';

interface DependenciesViewProps {
  dependencies: DependencySummary[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function DependenciesView({ dependencies, loading, error, onRefresh }: DependenciesViewProps) {
  const [searchText, setSearchText] = useState('');

  const visibleRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return dependencies;
    }

    return dependencies.filter((row) =>
      [row.name, row.version, row.purl, row.iri].some((field) => typeof field === 'string' && field.toLowerCase().includes(query))
    );
  }, [dependencies, searchText]);

  return (
    <ExploreDataTable
      title="Dependencies"
      description="Application packages and their immediate graph context."
      loading={loading}
      error={error}
      emptyMessage="Dependency data will appear here for the selected application."
      toolbar={
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <TextField
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            size="small"
            fullWidth
            placeholder="Search package, version, or PURL"
            inputProps={{
              'aria-label': 'Search dependencies'
            }}
            sx={{ maxWidth: { sm: 360 } }}
          />
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
            <Chip size="small" label={visibleRows.length.toLocaleString()} variant="outlined" />
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
      }
      isEmpty={visibleRows.length === 0}
    >
      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 560 }}>
        <Table stickyHeader size="small" aria-label="Dependencies table">
          <TableHead>
            <TableRow>
              <HeaderCell>Package</HeaderCell>
              <HeaderCell>Version</HeaderCell>
              <HeaderCell>PURL</HeaderCell>
              <HeaderCell align="center">Direct</HeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`dependency-skeleton-${index}`}>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary">
                        Loading dependencies...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              : visibleRows.map((row) => (
                  <TableRow hover key={row.iri}>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <CellValue title={row.name}>{row.name}</CellValue>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <CellValue title={row.version ?? '—'}>{row.version ?? '—'}</CellValue>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <CellValue title={row.purl ?? '—'}>{row.purl ?? '—'}</CellValue>
                    </TableCell>
                    <TableCell align="center">{row.direct ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ExploreDataTable>
  );
}

function HeaderCell({
  children,
  align = 'left'
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <TableCell align={align} sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
      {children}
    </TableCell>
  );
}

function CellValue({ title, children }: { title: string; children: string }) {
  return (
    <Tooltip title={title} enterDelay={350}>
      <Typography
        variant="body2"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 700
        }}
      >
        {children}
      </Typography>
    </Tooltip>
  );
}
