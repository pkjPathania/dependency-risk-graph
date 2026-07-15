import { createTheme, alpha } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      dark: '#1d4ed8',
      light: '#dbeafe'
    },
    background: {
      default: '#f6f8fb',
      paper: '#ffffff'
    },
    text: {
      primary: '#172033',
      secondary: '#667085'
    },
    divider: '#e4e7ec',
    error: {
      main: '#d92d20'
    },
    warning: {
      main: '#dc6803'
    },
    info: {
      main: '#1570ef'
    },
    success: {
      main: '#079455'
    }
  },
  shape: {
    borderRadius: 10
  },
  typography: {
    fontFamily:
      "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 650
    },
    h2: {
      fontWeight: 650
    },
    h3: {
      fontWeight: 650
    },
    h4: {
      fontWeight: 600
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.55
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.45
    },
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%'
        },
        body: {
          height: '100%',
          backgroundColor: '#f6f8fb',
          color: '#172033'
        },
        '#root': {
          minHeight: '100%'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#172033',
          boxShadow: 'none',
          borderBottom: '1px solid #e4e7ec'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e4e7ec'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e4e7ec',
          boxShadow: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderColor: '#e4e7ec'
        },
        elevation1: {
          boxShadow: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          boxShadow: 'none'
        },
        containedPrimary: {
          boxShadow: 'none'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          backgroundColor: alpha('#2563eb', 0.08)
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e4e7ec'
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f9fafb'
        }
      }
    }
  }
});
