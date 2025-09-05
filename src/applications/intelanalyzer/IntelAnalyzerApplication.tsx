/**
 * Intel Analyzer Application
 * 
 * Completely redesigned interface focused on Intel → IntelReport transformation
 * Uses the new IntelFusion service to convert raw intel into structured reports
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Alert, CircularProgress, ThemeProvider, createTheme } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

// Import our new Intel Transformation components
import { IntelTransformationDashboard } from '../../components/IntelAnalyzer/IntelTransformationDashboard';
import IntelAnalyzerLayout from '../../components/IntelAnalyzer/IntelAnalyzerLayout';

// Error boundary for Intel operations
import { IntelReports3DErrorBoundary } from '../../components/IntelReports3D/Core/IntelReports3DErrorBoundary';

// Cyberpunk Intel Theme for IntelAnalyzer
const cyberpunkIntelTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff41', // Bright green for intelligence data
      dark: '#00cc33',
      light: '#4dff77',
    },
    secondary: {
      main: '#ff4081', // Pink for highlights and alerts
      dark: '#cc3366',
      light: '#ff6699',
    },
    background: {
      default: '#0a0f0a',
      paper: 'rgba(0, 20, 0, 0.95)', // Subtle green tint for intel theme
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ffaa00',
    },
    info: {
      main: '#00c4ff',
    },
    success: {
      main: '#00ff41',
    },
  },
  typography: {
    fontFamily: "'Aldrich-Regular', 'Orbitron', monospace",
    h1: { fontFamily: "'Orbitron', monospace" },
    h2: { fontFamily: "'Orbitron', monospace" },
    h3: { fontFamily: "'Orbitron', monospace" },
    h4: { fontFamily: "'Orbitron', monospace" },
    h5: { fontFamily: "'Orbitron', monospace" },
    h6: { fontFamily: "'Orbitron', monospace" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(0, 20, 0, 0.95)',
          border: '1px solid rgba(0, 255, 65, 0.2)',
          borderRadius: '0',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 255, 65, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0',
          textTransform: 'uppercase',
          fontFamily: "'Aldrich-Regular', monospace",
          fontWeight: 600,
          letterSpacing: '0.5px',
        },
        contained: {
          background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
          color: '#000',
          border: '1px solid #00ff41',
          boxShadow: '0 0 15px rgba(0, 255, 65, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00cc33 0%, #009922 100%)',
            boxShadow: '0 0 25px rgba(0, 255, 65, 0.5)',
          },
        },
        outlined: {
          color: '#00ff41',
          border: '1px solid rgba(0, 255, 65, 0.5)',
          '&:hover': {
            border: '1px solid #00ff41',
            background: 'rgba(0, 255, 65, 0.1)',
            boxShadow: '0 0 15px rgba(0, 255, 65, 0.2)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '0',
          fontFamily: "'Aldrich-Regular', monospace",
        },
        standardError: {
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid rgba(255, 68, 68, 0.3)',
          color: '#ff4444',
        },
        standardInfo: {
          background: 'rgba(0, 196, 255, 0.1)',
          border: '1px solid rgba(0, 196, 255, 0.3)',
          color: '#00c4ff',
        },
        standardWarning: {
          background: 'rgba(255, 170, 0, 0.1)',
          border: '1px solid rgba(255, 170, 0, 0.3)',
          color: '#ffaa00',
        },
        standardSuccess: {
          background: 'rgba(0, 255, 65, 0.1)',
          border: '1px solid rgba(0, 255, 65, 0.3)',
          color: '#00ff41',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(0, 15, 0, 0.95) 0%, rgba(0, 25, 5, 0.98) 100%)',
          backdropFilter: 'blur(10px)',
          minHeight: '100vh',
          padding: '2rem',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#00ff41',
        },
      },
    },
  }
});
interface IntelAnalyzerState {
  loading: boolean;
  error: string | null;
  intelSystemReady: boolean;
  userHasAccess: boolean;
}

/**
 * Main Intel Analyzer Application
 * 
 * This is the Intel → IntelReport transformation interface that:
 * 1. Provides search and filtering for raw Intel data
 * 2. Enables fusion of multiple Intel sources into comprehensive reports
 * 3. Uses the IntelFusionService for sophisticated transformation logic
 * 4. Maintains proper security classifications and source attribution
 */
const IntelAnalyzerApplication: React.FC = () => {
  const { isAuthenticated, user: _user, isLoading: authLoading } = useAuth();
  const [appState, setAppState] = useState<IntelAnalyzerState>({
    loading: true,
    error: null,
    intelSystemReady: false,
    userHasAccess: false
  });

  // Initialize Intel transformation system
  useEffect(() => {
    const initializeIntelTransformationSystem = async () => {
      try {
        // TODO: When UnifiedUserService is implemented, check user Intel permissions here
        // For now, allow anonymous access to the Intel Transformation interface
        // Authentication will be required when real intel services are integrated
        
        // TODO: Initialize Intel services when unified services are ready
        // await intelTransformationService.initialize(user);
        
        setAppState({
          loading: false,
          error: null,
          intelSystemReady: true,
          userHasAccess: true
        });

      } catch (error) {
        setAppState(prev => ({
          ...prev,
          loading: false,
          error: `Failed to initialize Intel Transformation system: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    };

    if (!authLoading) {
      initializeIntelTransformationSystem();
    }
  }, [authLoading]);

  // Loading state
  if (authLoading || appState.loading) {
    return (
      <ThemeProvider theme={cyberpunkIntelTheme}>
        <IntelAnalyzerLayout>
          <Box className="stateContainer stateContainerCentered">
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              🔍 Initializing Intel Transformation System...
            </Typography>
          </Box>
        </IntelAnalyzerLayout>
      </ThemeProvider>
    );
  }

  // Render main interface regardless of authentication status
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={cyberpunkIntelTheme}>
        <IntelReports3DErrorBoundary>
          <IntelAnalyzerLayout>
            <IntelTransformationDashboard />
          </IntelAnalyzerLayout>
        </IntelReports3DErrorBoundary>
      </ThemeProvider>
    );
  }

  // Permission denied
  if (!appState.userHasAccess) {
    return (
      <ThemeProvider theme={cyberpunkIntelTheme}>
        <IntelAnalyzerLayout>
          <Container maxWidth="md" className="stateContainer">
            <Alert severity="error">
              <Typography variant="h6">Access Denied</Typography>
              <Typography>
                {appState.error || 'You do not have permission to access the Intel Transformation system.'}
              </Typography>
              <Typography sx={{ mt: 1, fontSize: '0.875rem' }}>
                The Intel Transformation system requires special clearance to convert raw intel into intelligence reports.
              </Typography>
            </Alert>
          </Container>
        </IntelAnalyzerLayout>
      </ThemeProvider>
    );
  }

  // Error state
  if (appState.error) {
    return (
      <ThemeProvider theme={cyberpunkIntelTheme}>
        <IntelAnalyzerLayout>
          <Container maxWidth="md" className="stateContainer">
            <Alert severity="error">
              <Typography variant="h6">Intel Transformation System Error</Typography>
              <Typography>{appState.error}</Typography>
              <Typography sx={{ mt: 1, fontSize: '0.875rem' }}>
                The Intel → Report transformation service is currently unavailable.
              </Typography>
            </Alert>
          </Container>
        </IntelAnalyzerLayout>
      </ThemeProvider>
    );
  }

  // Main application interface - Intel Transformation Dashboard
  return (
    <ThemeProvider theme={cyberpunkIntelTheme}>
      <IntelReports3DErrorBoundary>
        <IntelAnalyzerLayout>
          <IntelTransformationDashboard />
        </IntelAnalyzerLayout>
      </IntelReports3DErrorBoundary>
    </ThemeProvider>
  );
};

export default IntelAnalyzerApplication;
