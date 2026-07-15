import { Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface AssistantResultHostProps {
  children?: ReactNode;
}

export function AssistantResultHost({ children }: AssistantResultHostProps) {
  return (
    <Card>
      <CardContent sx={{ minHeight: 180 }}>
        {children ?? (
          <Typography variant="body2" color="text.secondary">
            Security assistant results will appear here.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
