import React, { useMemo } from 'react';
import { Box } from '@mui/material';

// Import the new Control Station layout
import NetRunnerControlStation from './components/layout/NetRunnerControlStation';

// Import logging services
import { LoggerFactory } from './services/logging';

/**
 * NetRunner Application
 * 
 * Main entry point for the NetRunner OSINT platform.
 * Now uses the new modular Control Station architecture.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */
const NetRunnerApp: React.FC = () => {
  // Initialize logger
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerApplication'), []);

  // Log application startup
  React.useEffect(() => {
    logger.info('NetRunner Application started', {
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      architecture: 'Control Station'
    });

    return () => {
      logger.info('NetRunner Application shutting down');
    };
  }, [logger]);

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'Aldrich, monospace'
      }}
    >
      <NetRunnerControlStation />
    </Box>
  );
};
      showWarning: (message: string) => {
        setErrorState({ hasError: true, message, severity: 'warning' });
      },
      showInfo: (message: string) => {
        setErrorState({ hasError: true, message, severity: 'info' });
      }
    };
    return new NetRunnerErrorHandler(userNotifier);
  }, []);

  // Initialize consolidated search functionality
  const {
    query,
    setQuery,
    results,
    isSearching,
    search,
    clearResults,
    clearError: clearSearchError
  } = useNetRunnerSearch({
    maxResults: 20,
    autoSearch: false
  });

  // Component lifecycle logging
  useEffect(() => {
    logger.info('NetRunner Application initialized', { 
      timestamp: new Date().toISOString(),
      activeTab 
    });

    return () => {
      logger.info('NetRunner application unmounting');
    };
  }, [logger, activeTab]);

  // Enhanced search handler using consolidated search functionality
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setErrorState({ 
        hasError: true, 
        message: 'Search query cannot be empty', 
        severity: 'warning' 
      });
      return;
    }
    
    const searchId = `search-${Date.now()}`;
    
    try {
      clearSearchError();
      
      logger.info('Starting OSINT search operation', { 
        searchId, 
        query,
        timestamp: new Date().toISOString()
      });

      // Use the consolidated search function
      await search();
      
      logger.info('OSINT search completed successfully', { 
        searchId, 
        resultCount: results.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const searchError = ErrorFactory.createSearchError(
        `Search operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NET-SRCH-002',
        { 
          component: 'NetRunnerApplication',
          details: { searchId, query, error }
        }
      );
      
      const context = {
        operation: 'osint_search',
        component: 'NetRunnerApplication',
        correlationId: searchId
      };
      
      const handlingResult = await errorHandler.handleError(searchError, context);
      
      logger.error('OSINT search failed', searchError, {
        searchId,
        handlingResult
      });
    }
  }, [query, search, results.length, clearSearchError, logger, errorHandler]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    logger.debug('Tab changed', { newTab: newValue, previousTab: activeTab });
  };

  const handleErrorClose = () => {
    setErrorState({ hasError: false, message: '', severity: 'info' });
  };

  // Enhanced Search Panel with improved UX
  const SearchPanel: React.FC = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        OSINT Search
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Enter search query for OSINT collection..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isSearching) {
              handleSearch();
            }
          }}
          disabled={isSearching}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          startIcon={isSearching ? <CircularProgress size={20} /> : <Search />}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </Box>

      {results.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Results: {results.length}
            </Typography>
            <Button size="small" onClick={clearResults}>
              Clear Results
            </Button>
          </Box>
          
          {results.map((result) => (
            <Card key={result.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {result.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {result.snippet}
                </Typography>
                <Typography variant="caption" display="block">
                  Source: {result.source} | Confidence: {Math.round(result.confidence * 100)}%
                </Typography>
                {result.metadata.tags && Array.isArray(result.metadata.tags) && result.metadata.tags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {(result.metadata.tags as string[]).map((tag) => (
                      <Typography
                        key={tag}
                        variant="caption"
                        sx={{
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          px: 1,
                          py: 0.5,
                          mr: 1,
                          borderRadius: 1,
                          display: 'inline-block'
                        }}
                      >
                        {tag}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );

  // Define tabs with enhanced components
  const tabs: NetRunnerTab[] = [
    {
      id: 'search',
      label: 'OSINT Search',
      icon: Search,
      component: SearchPanel
    },
    {
      id: 'tools',
      label: 'Power Tools',
      icon: Zap,
      component: PowerToolsPanel
    },
    {
      id: 'bots',
      label: 'Bot Roster',
      icon: Bot,
      component: BotControlPanel
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: Target,
      component: WorkflowControlPanel
    }
  ];

  const ActiveComponent = tabs[activeTab]?.component || SearchPanel;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          NetRunner OSINT Collection
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Open-Source Intelligence gathering and data collection platform
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="netrunner tabs">
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={<tab.icon />}
              label={tab.label}
              id={`netrunner-tab-${index}`}
              aria-controls={`netrunner-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Box>

      {/* Content Area */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <ActiveComponent />
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={errorState.hasError}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleErrorClose}
          severity={errorState.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorState.message}
          {errorState.code && (
            <Typography variant="caption" display="block">
              Error Code: {errorState.code}
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NetRunnerApp;
