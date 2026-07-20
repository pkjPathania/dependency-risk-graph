import { ButtonBase, Typography } from '@mui/material';
import { designTokens } from '../../theme/designTokens';
import { workbenchStyles } from './workbenchStyles';

interface WorkbenchNavItemProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function WorkbenchNavItem({ label, selected, onClick }: WorkbenchNavItemProps) {
  return (
    <ButtonBase
      aria-current={selected ? 'page' : undefined}
      onClick={onClick}
      sx={{
        position: 'relative',
        justifyContent: 'flex-start',
        width: '100%',
        minHeight: 46,
        px: 1.75,
        borderRadius: workbenchStyles.navigationItemRadius,
        color: selected ? designTokens.colors.white : designTokens.colors.navigationTextMuted,
        bgcolor: selected ? designTokens.colors.navigationSelected : 'transparent',
        '&:hover': {
          color: designTokens.colors.white,
          bgcolor: selected
            ? designTokens.colors.navigationSelected
            : designTokens.colors.navigationHover
        },
        '&:focus-visible': {
          outline: `3px solid ${designTokens.colors.accent}`,
          outlineOffset: -2
        },
        '&::after': selected
          ? {
              content: '""',
              position: 'absolute',
              top: 9,
              right: 6,
              bottom: 9,
              width: 3,
              borderRadius: 999,
              bgcolor: designTokens.colors.accent
            }
          : undefined
      }}
    >
      <Typography component="span" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
        {label}
      </Typography>
    </ButtonBase>
  );
}
