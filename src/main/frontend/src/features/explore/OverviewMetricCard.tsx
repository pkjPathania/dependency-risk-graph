import { Box, Skeleton, Stack, Typography } from '@mui/material';

interface OverviewMetricCardProps {
  label: string;
  value: string;
  caption?: string;
  loading: boolean;
}

export function OverviewMetricCard({ label, value, caption, loading }: OverviewMetricCardProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 1.25,
        py: 1,
        bgcolor: 'background.paper',
        minWidth: 0
      }}
    >
      <Stack spacing={0.35}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, fontSize: '0.68rem' }}
        >
          {label}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width="65%" height={28} />
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.08rem', lineHeight: 1.15 }}>
            {value}
          </Typography>
        )}
        {caption ? (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
            {caption}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
