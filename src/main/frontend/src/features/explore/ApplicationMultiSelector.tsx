import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { ApplicationSummary } from '../../api/types';

interface ApplicationMultiSelectorProps {
  applications: ApplicationSummary[];
  selectedApplicationIris: string[];
  loading: boolean;
  onChange: (applicationIris: string[]) => void;
}

const SELECT_ALL_APPLICATIONS = '__all_applications__';

export function ApplicationMultiSelector({
  applications,
  selectedApplicationIris,
  loading,
  onChange
}: ApplicationMultiSelectorProps) {
  const selectableApplications = applications.filter(
    (application): application is ApplicationSummary & { iri: string } =>
      Boolean(application.iri?.trim())
  );
  const allSelected =
    selectableApplications.length > 0
    && selectedApplicationIris.length === selectableApplications.length;

  function handleChange(event: SelectChangeEvent<string[]>) {
    const values = typeof event.target.value === 'string'
      ? event.target.value.split(',')
      : event.target.value;

    if (values.at(-1) === SELECT_ALL_APPLICATIONS) {
      onChange(allSelected ? [] : selectableApplications.map(({ iri }) => iri));
      return;
    }

    const validIris = new Set(selectableApplications.map(({ iri }) => iri));
    onChange(Array.from(new Set(values.filter((iri) => validIris.has(iri)))));
  }

  return (
    <FormControl
      size="small"
      disabled={loading || selectableApplications.length === 0}
      sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}
    >
      <InputLabel id="explore-applications-label">Applications</InputLabel>
      <Select
        multiple
        labelId="explore-applications-label"
        label="Applications"
        value={selectedApplicationIris}
        onChange={handleChange}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return 'Select applications';
          }
          if (selected.length === selectableApplications.length) {
            return `All applications (${selected.length})`;
          }
          if (selected.length === 1) {
            return applicationLabel(selectableApplications.find(({ iri }) => iri === selected[0]));
          }
          return `${selected.length} applications selected`;
        }}
        sx={{
          '& .MuiSelect-select': {
            fontSize: '0.8rem',
            fontWeight: 800
          }
        }}
      >
        <MenuItem value={SELECT_ALL_APPLICATIONS}>
          <Checkbox checked={allSelected} indeterminate={selectedApplicationIris.length > 0 && !allSelected} />
          <ListItemText primary="Select all applications" />
        </MenuItem>
        {selectableApplications.map((application) => (
          <MenuItem key={application.iri} value={application.iri}>
            <Checkbox checked={selectedApplicationIris.includes(application.iri)} />
            <ListItemText primary={applicationLabel(application)} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function applicationLabel(application?: ApplicationSummary): string {
  if (!application) {
    return 'Selected application';
  }
  return `${application.name ?? 'Unknown'} · ${application.version ?? 'Unknown'}`;
}
