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
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(220px, 320px) auto' },
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
      <Stack direction="row" alignItems="stretch" sx={{ height: '100%' }}>
        <Button variant="contained" onClick={onSubmit} disabled={loading} sx={{ minHeight: 56, minWidth: 120 }}>
          {loading ? 'Finding...' : 'Find Path'}
        </Button>
      </Stack>
    </Box>
  );
}
