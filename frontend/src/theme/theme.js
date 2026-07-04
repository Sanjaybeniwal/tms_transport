import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Electric blue
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#7c3aed', // Purple violet
      light: '#a78bfa',
      dark: '#5b21b6',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f8fafc', // Clean light gray-blue
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
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f1f5f9',
          color: '#475569'
        }
      }
    }
  }
});

export default theme;
