import { Box } from '@mui/material';
import { designTokens } from '../../theme/designTokens';

export function GraphLogoMark() {
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        borderRadius: '10px',
        bgcolor: designTokens.text.navigationSecondary,
        transition: 'background-color 160ms ease'
      }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 32 32"
        width="26"
        height="26"
      >
        <g
          fill="none"
          stroke={designTokens.text.primary}
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M9 9.5 16 16m0 0 7-7m-7 7 7 7" />
        </g>
        <g fill={designTokens.text.primary}>
          <circle cx="9" cy="9.5" r="2.7" />
          <circle cx="16" cy="16" r="2.7" />
          <circle cx="23" cy="9" r="2.7" />
          <circle cx="23" cy="23" r="2.7" />
        </g>
      </svg>
    </Box>
  );
}
