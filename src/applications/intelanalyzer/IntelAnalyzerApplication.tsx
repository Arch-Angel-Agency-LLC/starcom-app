/**
 * Intel Analyzer Application
 * 
 * Completely redesigned interface focused on Intel → IntelReport transformation
 * Uses the new IntelFusion service to convert raw intel into structured reports
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

// Import our new Intel Transformation components
import { IntelTransformationDashboard } from '../../components/IntelAnalyzer/IntelTransformationDashboard';

// Error boundary for Intel operations
import { IntelReports3DErrorBoundary } from '../../components/IntelReports3D/Core/IntelReports3DErrorBoundary';

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
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#00ff00' }} />
        <Typography variant="h6" sx={{ ml: 2, color: '#00ff00', fontFamily: 'monospace' }}>
          🔍 Initializing Intel Transformation System...
        </Typography>
      </Box>
    );
  }

  // Render main interface regardless of authentication status
  if (!isAuthenticated) {
    return (
      <IntelReports3DErrorBoundary>
        <Box sx={{ 
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#00ff00'
        }}>
          <IntelTransformationDashboard />
        </Box>
      </IntelReports3DErrorBoundary>
    );
  }

  // Permission denied
  if (!appState.userHasAccess) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
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
    );
  }

  // Error state
  if (appState.error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Intel Transformation System Error</Typography>
          <Typography>{appState.error}</Typography>
          <Typography sx={{ mt: 1, fontSize: '0.875rem' }}>
            The Intel → Report transformation service is currently unavailable.
          </Typography>
        </Alert>
      </Container>
    );
  }

  // Main application interface - Intel Transformation Dashboard
  return (
    <IntelReports3DErrorBoundary>
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#00ff00'
      }}>
        <IntelTransformationDashboard />
      </Box>
    </IntelReports3DErrorBoundary>
  );
};

export default IntelAnalyzerApplication;
