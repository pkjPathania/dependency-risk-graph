import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

interface RestCallProgressProps {
  visible: boolean;
}

export function RestCallProgress({ visible }: RestCallProgressProps) {
  if (!visible) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress aria-label="Loading…" variant="query" />
    </Box>
  );
}
