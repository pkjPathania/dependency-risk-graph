import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { designTokens } from '../../theme/designTokens';

interface WorkbenchPlaceholderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  minHeight?: number;
}

export function WorkbenchPlaceholder({
  title,
  description,
  children,
  minHeight = 180
}: WorkbenchPlaceholderProps) {
  return (
    <Box
      sx={{
        minHeight,
        p: 2.5,
        bgcolor: designTokens.surface.card,
        border: '1px dashed',
        borderColor: designTokens.border.default,
        borderRadius: 2
      }}
    >
      <Typography fontWeight={700}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
}
