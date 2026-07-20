import { alpha, createTheme } from '@mui/material/styles';
import { designTokens } from './theme/designTokens';

const { colors, security } = designTokens;

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.navigation,
      dark: colors.navigationDark,
      light: colors.surfaceMuted,
      contrastText: colors.white
    },
    secondary: {
      main: colors.accent,
      dark: colors.accentDark,
      light: colors.accentLight,
      contrastText: colors.textPrimary
    },
    background: {
      default: colors.appShell,
      paper: colors.surface
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary
    },
    divider: colors.border,
    error: {
      main: security.critical,
      dark: designTokens.securityDark.critical,
      light: alpha(security.critical, 0.1)
    },
    warning: {
      main: security.high,
      dark: designTokens.securityDark.high,
      light: alpha(security.high, 0.1)
    },
    info: {
      main: security.medium,
      dark: designTokens.securityDark.medium,
      light: alpha(security.medium, 0.14)
    },
    success: {
      main: security.safe,
      dark: designTokens.securityDark.safe,
      light: alpha(security.safe, 0.16)
    },
    action: {
      hover: alpha(colors.navigation, 0.055),
      selected: alpha(colors.navigation, 0.09),
      disabledBackground: alpha(colors.navigation, 0.1),
      focus: alpha(colors.accent, 0.65)
    }
  },
  shape: {
    borderRadius: 10
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 650, letterSpacing: '-0.025em' },
    h2: { fontWeight: 650, letterSpacing: '-0.025em' },
    h3: { fontWeight: 650, letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, letterSpacing: '-0.018em' },
    h5: { fontWeight: 600, letterSpacing: '-0.012em' },
    h6: { fontWeight: 600 },
    body1: { fontSize: '0.95rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.45 },
    button: { textTransform: 'none', fontWeight: 700 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: '100%', backgroundColor: colors.canvas },
        body: {
          height: '100%',
          backgroundColor: colors.canvas,
          color: colors.textPrimary
        },
        '#root': { minHeight: '100%' },
        '::selection': {
          backgroundColor: colors.accent,
          color: colors.textPrimary
        },
        'code, pre, kbd, samp': {
          fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace'
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            scrollBehavior: 'auto !important',
            transitionDuration: '0.01ms !important',
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.navigation,
          color: colors.white,
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: `1px solid ${colors.navigationSelected}`
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.navigation,
          color: colors.white,
          borderColor: colors.navigationSelected
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          backgroundImage: 'none',
          borderColor: colors.border
        },
        elevation1: { boxShadow: 'none' },
        elevation2: { boxShadow: `0 8px 24px ${alpha(colors.navigation, 0.08)}` }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          boxShadow: 'none',
          '&:focus-visible': {
            outline: `3px solid ${alpha(colors.accent, 0.85)}`,
            outlineOffset: 2
          }
        },
        containedPrimary: {
          backgroundColor: colors.navigation,
          color: colors.white,
          '&:hover': { backgroundColor: colors.navigationSelected, boxShadow: 'none' }
        },
        containedSecondary: {
          backgroundColor: colors.accent,
          color: colors.textPrimary,
          '&:hover': { backgroundColor: colors.accentHover, boxShadow: 'none' }
        },
        outlinedPrimary: {
          color: colors.textPrimary,
          borderColor: colors.textSecondary,
          '&:hover': {
            backgroundColor: alpha(colors.navigation, 0.05),
            borderColor: colors.navigation
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: colors.textSecondary,
          '&:hover': { backgroundColor: colors.surfaceMuted, color: colors.textPrimary },
          '&:focus-visible': {
            outline: `3px solid ${alpha(colors.accent, 0.85)}`,
            outlineOffset: 2
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.white,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.textSecondary },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.navigation,
            boxShadow: `0 0 0 3px ${alpha(colors.accent, 0.72)}`
          }
        },
        input: {
          '&::placeholder': { color: colors.textSecondary, opacity: 0.78 }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { backgroundColor: colors.white } }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: { backgroundColor: colors.white }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          backgroundColor: colors.surfaceMuted,
          color: colors.textPrimary
        },
        outlined: { borderColor: colors.border }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: colors.accent, height: 3 }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: colors.textSecondary,
          '&.Mui-selected': { color: colors.textPrimary },
          '&:focus-visible': { outline: `3px solid ${alpha(colors.accent, 0.85)}`, outlineOffset: -3 }
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
          color: colors.textSecondary,
          '&.Mui-selected': {
            backgroundColor: colors.accent,
            color: colors.textPrimary,
            '&:hover': { backgroundColor: colors.accentHover }
          }
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.white,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 12px 30px ${alpha(colors.navigation, 0.12)}`
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: colors.surfaceMuted,
            '&:hover': { backgroundColor: colors.border }
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.appShell,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 20px 56px ${alpha(colors.navigation, 0.18)}`
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: colors.navigation, color: colors.white }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.border },
        head: {
          fontWeight: 700,
          color: colors.textPrimary,
          backgroundColor: colors.surfaceMuted
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&.MuiTableRow-hover:hover': { backgroundColor: alpha(colors.navigation, 0.035) } }
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { color: colors.textSecondary }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: colors.surfaceMuted },
        bar: { backgroundColor: colors.accent }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: colors.textPrimary,
          textDecorationColor: colors.textSecondary,
          '&:hover': { textDecorationColor: colors.textPrimary }
        }
      }
    }
  }
});
