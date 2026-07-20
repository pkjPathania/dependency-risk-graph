import { Box, Typography } from '@mui/material';

interface WorkbenchViewHeaderProps {
  title: string;
  description: string;
}

export function WorkbenchViewHeader({ title, description }: WorkbenchViewHeaderProps) {
  return (
    <Box>
      <Typography
        component="h1"
        sx={{
          fontSize: '1.35rem',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.015em'
        }}
      >
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.625 }}>
        {description}
      </Typography>
    </Box>
  );
}
