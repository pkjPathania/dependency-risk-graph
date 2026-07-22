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
        color: selected ? designTokens.text.navigationPrimary : designTokens.text.navigationSecondary,
        bgcolor: selected ? designTokens.shell.sidebarActive : 'transparent',
        '&:hover': {
          color: designTokens.text.navigationPrimary,
          bgcolor: selected
            ? designTokens.shell.sidebarActive
            : designTokens.shell.sidebarHover
        },
        '&:focus-visible': {
          outline: `2px solid ${designTokens.accent.limeHover}`,
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
              bgcolor: designTokens.accent.lime
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
