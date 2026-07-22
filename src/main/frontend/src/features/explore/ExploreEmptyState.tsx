import { Card, CardContent, Stack, Typography } from '@mui/material';

interface ExploreEmptyStateProps {
  title: string;
  message: string;
}

export function ExploreEmptyState({ title, message }: ExploreEmptyStateProps) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={0.75}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: '0.82rem' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
            {message}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
