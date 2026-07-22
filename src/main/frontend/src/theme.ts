import { alpha, createTheme } from '@mui/material/styles';
import { designTokens } from './theme/designTokens';

const { accent, border, disabled, security, shell, surface, text } = designTokens;

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: accent.lime,
      dark: accent.limePressed,
      light: accent.limeHover,
      contrastText: accent.contrastText
    },
    secondary: {
      main: shell.topbar,
      dark: shell.sidebarActive,
      light: shell.sidebar,
      contrastText: text.navigationPrimary
    },
    background: {
      default: surface.app,
      paper: surface.panel
    },
    text: {
      primary: text.primary,
      secondary: text.secondary
    },
    divider: border.default,
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
      hover: alpha(shell.topbar, 0.055),
      selected: alpha(shell.topbar, 0.09),
      disabled: disabled.text,
      disabledBackground: disabled.background,
      focus: alpha(accent.lime, 0.65)
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
        html: { height: '100%', backgroundColor: surface.app },
        body: {
          height: '100%',
          backgroundColor: surface.app,
          color: text.primary
        },
        '#root': { minHeight: '100%' },
        '::selection': {
          backgroundColor: accent.lime,
          color: text.primary
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
          backgroundColor: shell.topbar,
          color: text.navigationPrimary,
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: `1px solid ${border.default}`
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: { color: 'inherit' }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: shell.sidebar,
          color: text.navigationPrimary,
          borderColor: border.default
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: surface.panel,
          backgroundImage: 'none',
          borderColor: border.default
        },
        elevation1: { boxShadow: 'none' },
        elevation2: { boxShadow: `0 8px 24px ${alpha(text.primary, 0.08)}` }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: surface.card,
          border: `1px solid ${border.default}`,
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
          '&.Mui-disabled': {
            borderColor: disabled.border,
            color: disabled.text,
            opacity: 1
          },
          '&:focus-visible': {
            outline: `2px solid ${alpha(accent.limeHover, 0.55)}`,
            outlineOffset: 2
          }
        },
        containedPrimary: {
          backgroundColor: accent.lime,
          color: text.primary,
          '&:hover': { backgroundColor: accent.limeHover, boxShadow: 'none' },
          '&:active': { backgroundColor: accent.limePressed },
          '&.Mui-disabled': {
            backgroundColor: disabled.background,
            color: disabled.text,
            opacity: 1
          }
        },
        containedSecondary: {
          backgroundColor: surface.card,
          color: text.primary,
          border: `1px solid ${border.default}`,
          '&:hover': {
            backgroundColor: surface.app,
            borderColor: border.strong,
            boxShadow: 'none'
          },
          '&.Mui-disabled': {
            backgroundColor: disabled.background,
            color: disabled.text,
            opacity: 1
          }
        },
        outlinedPrimary: {
          color: text.primary,
          borderColor: border.default,
          '&:hover': {
            backgroundColor: surface.app,
            borderColor: border.strong
          },
          '&.Mui-disabled': {
            backgroundColor: disabled.background,
            borderColor: disabled.border,
            color: disabled.text,
            opacity: 1
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: text.secondary,
          '&:hover': { backgroundColor: surface.app, color: text.primary },
          '&.Mui-disabled': { color: disabled.text, opacity: 1 },
          '&:focus-visible': {
            outline: `2px solid ${alpha(accent.limeHover, 0.55)}`,
            outlineOffset: 2
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: surface.card,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: border.default },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: border.strong },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: accent.limePressed,
            boxShadow: `0 0 0 2px ${alpha(accent.limeHover, 0.28)}`
          },
          '&.Mui-disabled': {
            backgroundColor: disabled.background,
            color: disabled.text,
            opacity: 1,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: disabled.border }
          }
        },
        input: {
          color: text.primary,
          '&::placeholder': { color: text.placeholder, opacity: 1 },
          '&.Mui-disabled': { WebkitTextFillColor: disabled.text, opacity: 1 }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: surface.card,
            '&.Mui-disabled': { backgroundColor: disabled.background }
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          backgroundColor: surface.card,
          color: text.primary,
          '&.Mui-disabled': {
            backgroundColor: disabled.background,
            WebkitTextFillColor: disabled.text,
            opacity: 1
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: text.secondary,
          '&.Mui-focused': { color: text.primary },
          '&.Mui-disabled': { color: disabled.text, opacity: 1 }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          backgroundColor: surface.app,
          color: text.primary,
          '&.Mui-disabled': {
            backgroundColor: disabled.background,
            color: disabled.text,
            opacity: 1
          }
        },
        outlined: { borderColor: border.default }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: accent.lime, height: 3 }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: text.secondary,
          '&.Mui-selected': { color: text.primary },
          '&.Mui-disabled': { color: disabled.text, opacity: 1 },
          '&:focus-visible': { outline: `2px solid ${alpha(accent.limeHover, 0.55)}`, outlineOffset: -2 }
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: border.default,
          color: text.secondary,
          '&.Mui-selected': {
            backgroundColor: accent.lime,
            color: text.primary,
            '&:hover': { backgroundColor: accent.limeHover }
          },
          '&.Mui-disabled': {
            backgroundColor: disabled.background,
            borderColor: disabled.border,
            color: disabled.text,
            opacity: 1
          }
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: surface.elevated,
          border: `1px solid ${border.default}`,
          boxShadow: `0 12px 30px ${alpha(text.primary, 0.12)}`
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: surface.app,
            '&:hover': { backgroundColor: alpha(accent.lime, 0.18) }
          },
          '&.Mui-disabled': {
            color: disabled.text,
            opacity: 1
          }
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': { color: disabled.text, opacity: 1 }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: surface.panel,
          border: `1px solid ${border.default}`,
          boxShadow: `0 20px 56px ${alpha(text.primary, 0.18)}`
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: text.primary, color: surface.elevated }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: border.default },
        head: {
          fontWeight: 700,
          color: text.primary,
          backgroundColor: surface.app
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: surface.card,
          borderColor: border.default
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': { backgroundColor: alpha(text.primary, 0.035) },
          '&.Mui-selected': {
            backgroundColor: alpha(accent.lime, 0.18),
            '&:hover': { backgroundColor: alpha(accent.lime, 0.24) }
          }
        }
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { color: text.secondary }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: surface.app },
        bar: { backgroundColor: shell.topbar }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: border.default }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: text.primary,
          textDecorationColor: text.secondary,
          '&:hover': { textDecorationColor: text.primary }
        }
      }
    }
  }
});
