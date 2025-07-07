import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  CircularProgress,
  TextField,
  Card,
  CardContent,
  Tabs,
  Tab,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Search, 
  Database, 
  Settings, 
  BarChart2,
  Clock,
  ExternalLink,
  Filter
} from 'lucide-react';

// Import custom hook for search functionality
import { useNetRunnerSearch } from './hooks/useNetRunnerSearch';
import { DashboardMode, SearchSource } from './types/netrunner';
import FilterPanel from './components/FilterPanel';
import EntityExtractor from './components/EntityExtractor';

/**
 * NetRunner Dashboard
 * 
 * Advanced online search and reconnaissance dashboard for OSINT operations.
 * This component serves as the main interface for the NetRunner module.
 * 
 * Features:
 * - Multi-source search capabilities
 * - Advanced filtering options
 * - Results visualization
 * - Search history tracking
 * - Entity analysis
 */
const NetRunnerDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<DashboardMode>('search');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchHistoryAnchor, setSearchHistoryAnchor] = useState<null | HTMLElement>(null);
  
  // Sources configuration with premium flag
  const [sources, setSources] = useState<SearchSource[]>([
    { id: 'web', label: 'Web', checked: true },
    { id: 'social', label: 'Social Media', checked: true },
    { id: 'news', label: 'News & Media', checked: true },
    { id: 'technical', label: 'Technical Resources', checked: true },
    { id: 'darkweb', label: 'Dark Web', checked: false, premium: true },
    { id: 'financial', label: 'Financial', checked: false, premium: true },
  ]);

  // Map tabs to categories
  const tabToCategory: Record<number, string> = {
    0: 'all',
    1: 'social',
    2: 'news',
    3: 'darkweb',
    4: 'technical',
    5: 'financial'
  };
  
  // Handle filter toggle
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Use our custom search hook
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    filters,
    setFilters,
    results: searchResults,
    searchHistory,
    isSearching,
    search: performSearch
  } = useNetRunnerSearch({
    initialSources: sources.filter(s => s.checked).map(s => s.id)
  });

  // Handle search submission
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Build filters based on current tab and time range
    const searchFilters: Record<string, unknown> = { ...filters };
    
    // Add category filter based on active tab if not "All Sources"
    if (activeTab > 0) {
      searchFilters.category = tabToCategory[activeTab];
    }
    
    // Add time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      searchFilters.timeRange = {
        start: startDate.toISOString(),
        end: now.toISOString()
      };
    }
    
    // Update filters and perform search
    setFilters(searchFilters);
    await performSearch();
  };

  // Update sources when changes are made
  useEffect(() => {
    // Get selected source IDs for filtering
    sources
      .filter(source => source.checked)
      .map(source => source.id);
    
    // This will be used in the search
  }, [sources]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // If we have search results, automatically filter them by the new category
    if (searchResults.length > 0) {
      handleSearch();
    }
  };

  // Handle settings menu
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setAnchorEl(null);
  };
  
  // Handle search history menu
  const handleHistoryClick = (event: React.MouseEvent<HTMLElement>) => {
    setSearchHistoryAnchor(event.currentTarget);
  };
  
  const handleHistoryClose = () => {
    setSearchHistoryAnchor(null);
  };
  
  // Select a search from history
  const handleSelectHistory = (historicQuery: string) => {
    setSearchQuery(historicQuery);
    handleHistoryClose();
    // Auto search when selecting from history
    setTimeout(() => handleSearch(), 0);
  };
  
  // Handle mode change
  const handleModeChange = (mode: DashboardMode) => {
    setActiveMode(mode);
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          NetRunner
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            onClick={handleSettingsClick}
            startIcon={<Settings />}
            sx={{ mr: 1 }}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleModeChange(activeMode === 'search' ? 'advanced' : 'search')}
            startIcon={activeMode === 'search' ? <BarChart2 /> : <Search />}
          >
            {activeMode === 'search' ? 'Advanced Mode' : 'Basic Mode'}
          </Button>
          
          {/* Settings Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleSettingsClose}
          >
            <MenuItem onClick={handleSettingsClose}>Search Settings</MenuItem>
            <MenuItem onClick={handleSettingsClose}>API Configuration</MenuItem>
            <MenuItem onClick={handleSettingsClose}>Data Sources</MenuItem>
            <MenuItem onClick={handleSettingsClose}>Privacy Settings</MenuItem>
          </Menu>
          
          {/* Search History Menu */}
          <Menu
            anchorEl={searchHistoryAnchor}
            open={Boolean(searchHistoryAnchor)}
            onClose={handleHistoryClose}
          >
            {searchHistory.length > 0 ? (
              searchHistory.map((query, index) => (
                <MenuItem key={index} onClick={() => handleSelectHistory(query)}>
                  {query}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No search history</MenuItem>
            )}
          </Menu>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter search query, domain, IP, username, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search style={{ color: 'gray', marginRight: 8 }} />
                }}
              />
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              sx={{ height: '56px', minWidth: '120px' }}
            >
              {isSearching ? <CircularProgress size={24} color="inherit" /> : 'Search'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={toggleFilters}
              sx={{ height: '56px', minWidth: '56px', p: '6px' }}
              title="Advanced Filters"
            >
              <Filter size={24} />
            </Button>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab label="All Sources" />
              <Tab label="Social Media" />
              <Tab label="News & Media" />
              <Tab label="Dark Web" />
              <Tab label="Technical" />
              <Tab label="Financial" />
            </Tabs>
          </Box>
        </form>
        
        <FilterPanel
          sources={sources}
          onSourcesChange={(updatedSources) => setSources(updatedSources)}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={toggleFilters}
          isOpen={showFilters}
        />
      </Paper>
      
      
      <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
        {/* Main results column */}
        <Box sx={{ flex: 2 }}>
          {isSearching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
            </Box>
          ) : searchResults.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {searchResults.map((result) => (
                <Card key={result.id}>
                  <CardContent>
                    <Typography variant="h6">{result.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Source: {result.source} | {new Date(result.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {result.snippet}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">
                        Confidence: {(result.confidence * 100).toFixed(0)}%
                      </Typography>
                      {result.url && (
                        <Button 
                          size="small" 
                          variant="outlined" 
                          href={result.url} 
                          target="_blank"
                          endIcon={<ExternalLink size={16} />}
                        >
                          Open
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : searchQuery ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6">No results found</Typography>
              <Typography variant="body2" color="text.secondary">
                Try modifying your search terms or selecting a different category
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Database size={48} style={{ color: 'gray', marginBottom: 16 }} />
              <Typography variant="h6">Enter a search query to begin</Typography>
              <Typography variant="body2" color="text.secondary">
                NetRunner can search across multiple sources simultaneously
              </Typography>
              {searchHistory.length > 0 && (
                <Button 
                  variant="text" 
                  onClick={handleHistoryClick}
                  startIcon={<Clock />}
                  sx={{ mt: 2 }}
                >
                  View Search History
                </Button>
              )}
            </Box>
          )}
        </Box>
        
        {/* Entity extraction column */}
        <Box sx={{ flex: 1 }}>
          <EntityExtractor 
            searchResults={searchResults}
            isLoading={isSearching}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default NetRunnerDashboard;
