import { Box, Button, Stack, TextField } from '@mui/material';

interface DependencyPathFormProps {
  packageName: string;
  version: string;
  loading: boolean;
  onPackageNameChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onSubmit: () => void;
}

export function DependencyPathForm({
  packageName,
  version,
  loading,
  onPackageNameChange,
  onVersionChange,
  onSubmit
}: DependencyPathFormProps) {
  return (
    <Stack spacing={1}>
      <Box
        sx={{
          display: 'grid',
          gap: 1.25,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(220px, 320px)' },
          alignItems: 'start'
        }}
      >
        <TextField
          label="Package name"
          value={packageName}
          onChange={(event) => onPackageNameChange(event.target.value)}
          fullWidth
          autoComplete="off"
        />
        <TextField
          label="Version"
          value={version}
          onChange={(event) => onVersionChange(event.target.value)}
          fullWidth
          autoComplete="off"
          helperText="Optional"
        />
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-start" flexWrap="wrap">
        <Button variant="contained" onClick={onSubmit} disabled={loading}>
          {loading ? 'Finding...' : 'Find Path'}
        </Button>
      </Stack>
    </Stack>
  );
}
