import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#197769', // Electric blue
      light: '#65a69b',
      dark: '#105e52',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#b97930', // Purple violet
      light: '#ebbc80',
      dark: '#925b20',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f4f6f3', // Clean light gray-blue
      paper: '#ffffff'
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#475569' // Slate 600
    },
    error: {
      main: '#ef4444'
    },
    warning: {
      main: '#f59e0b'
    },
    success: {
      main: '#10b981'
    },
    info: {
      main: '#06b6d4'
    }
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Devanagari", "Segoe UI", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      letterSpacing: '-0.02em'
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.015em'
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem'
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem'
    },
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 14, margin: 16, width: 'calc(100% - 32px)', maxHeight: 'calc(100% - 32px)' } }
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: '1.1rem', lineHeight: 1.5 } }
    },
    MuiDialogContent: {
      styleOverrides: { root: { paddingTop: '24px !important' } }
    },
    MuiDialogActions: {
      styleOverrides: { root: { flexWrap: 'wrap', gap: 8, position: 'sticky', bottom: 0, backgroundColor: '#ffffff', zIndex: 1 } }
    },
    MuiTabs: { defaultProps: { variant: 'scrollable', scrollButtons: 'auto', allowScrollButtonsMobile: true } },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
            opacity: 0.9
          }
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: 'none'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          border: '1px solid #e2e8f0',
          transition: 'border-color 0.15s ease-in-out',
          '&:hover': {
            borderColor: '#cbd5e1'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxShadow: 'none',
          borderBottom: '1px solid #e2e8f0'
        }
      }
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } }
    },
    MuiTableRow: {
      styleOverrides: { root: { '&:last-child td': { borderBottom: 0 } } }
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#edf0ee', padding: '16px', fontVariantNumeric: 'tabular-nums' },
        head: {
          fontWeight: 600,
          backgroundColor: '#f4f7f5',
          color: '#475569'
        }
      }
    }
  }
});

export default theme;
