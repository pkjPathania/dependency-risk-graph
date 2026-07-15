import { Card, CardContent, Stack, Typography } from '@mui/material';

interface SummaryCardProps {
  label: string;
  value: string;
}

export function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <Card>
      <CardContent sx={{ py: 1.75, '&:last-child': { pb: 1.75 } }}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {label}
          </Typography>
          <Typography variant="h6" sx={{ fontSize: '1.05rem', lineHeight: 1.3 }}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
