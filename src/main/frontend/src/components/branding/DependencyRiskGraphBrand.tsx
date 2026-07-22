import { ButtonBase, Typography } from '@mui/material';
import { designTokens } from '../../theme/designTokens';
import { GraphLogoMark } from './GraphLogoMark';

interface DependencyRiskGraphBrandProps {
  onClick: () => void;
}

export function DependencyRiskGraphBrand({ onClick }: DependencyRiskGraphBrandProps) {
  return (
    <ButtonBase
      aria-label="Dependency Risk Graph"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        flexShrink: 0,
        borderRadius: '12px',
        p: 0.25,
        color: designTokens.text.navigationPrimary,
        '&:hover': {
          color: designTokens.text.navigationSecondary,
          '& > div': {
            bgcolor: designTokens.text.navigationPrimary
          }
        },
        '&:focus-visible': {
          outline: `2px solid ${designTokens.accent.limeHover}`,
          outlineOffset: 3
        }
      }}
    >
      <GraphLogoMark />
      <Typography
        component="span"
        sx={{
          display: { xs: 'none', md: 'block' },
          color: 'inherit',
          fontSize: '1.125rem',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap'
        }}
      >
        Dependency Risk Graph
      </Typography>
    </ButtonBase>
  );
}
