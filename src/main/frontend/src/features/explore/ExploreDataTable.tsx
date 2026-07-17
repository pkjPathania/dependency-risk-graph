import { Alert, Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface ExploreDataTableProps {
  title: string;
  description?: string;
  loading: boolean;
  error?: string | null;
  emptyMessage: string;
  toolbar?: ReactNode;
  isEmpty: boolean;
  children: ReactNode;
}

export function ExploreDataTable({
  title,
  description,
  loading,
  error,
  emptyMessage,
  toolbar,
  isEmpty,
  children
}: ExploreDataTableProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Stack spacing={0.35}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, fontWeight: 800 }}>
              {title}
            </Typography>
            {description ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                {description}
              </Typography>
            ) : null}
          </Stack>

          {toolbar ? <Box>{toolbar}</Box> : null}
          {loading ? <LinearProgress aria-label={`${title} loading`} /> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {!loading && !error && isEmpty ? (
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 2.25,
                bgcolor: 'background.default'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {emptyMessage}
              </Typography>
            </Box>
          ) : null}
          {!error && (loading || !isEmpty) ? children : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
