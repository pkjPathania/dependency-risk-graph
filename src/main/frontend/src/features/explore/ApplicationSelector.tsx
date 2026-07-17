import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { ApplicationSummary } from '../../api/types';

interface ApplicationSelectorProps {
  summaries: ApplicationSummary[];
  selectedApplicationIri: string;
  loading: boolean;
  onSelectApplication: (applicationIri: string) => void;
}

export function ApplicationSelector({
  summaries,
  selectedApplicationIri,
  loading,
  onSelectApplication
}: ApplicationSelectorProps) {
  function handleChange(event: SelectChangeEvent<string>) {
    onSelectApplication(event.target.value);
  }

  return (
    <FormControl fullWidth size="small" disabled={loading || summaries.length === 0}>
      <InputLabel id="explore-application-label">APPLICATION</InputLabel>
      <Select
        labelId="explore-application-label"
        label="APPLICATION"
        value={selectedApplicationIri}
        onChange={handleChange}
        renderValue={(value) => {
          const selected = summaries.find((summary) => summary.iri === value) ?? null;
          return selected ? formatApplicationLabel(selected) : 'Select an application';
        }}
        sx={compactSelectSx}
      >
        {summaries.length === 0 ? (
          <MenuItem disabled value="">
            No applications available
          </MenuItem>
        ) : null}

        {summaries.map((summary) => (
          <MenuItem key={summary.iri ?? `${summary.name ?? 'application'}-${summary.version ?? 'unknown'}`} value={summary.iri ?? ''}>
            <Stack spacing={0.15} sx={{ py: 0.25 }}>
              <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.8rem' }}>
                {formatApplicationLabel(summary)}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function formatApplicationLabel(summary: ApplicationSummary): string {
  const name = summary.name ?? 'Unknown';
  const version = summary.version ?? 'Unknown';
  return `${name} · ${version}`;
}

const compactSelectSx = {
  '& .MuiSelect-select': {
    fontWeight: 800,
    fontSize: '0.8rem',
    py: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
};
