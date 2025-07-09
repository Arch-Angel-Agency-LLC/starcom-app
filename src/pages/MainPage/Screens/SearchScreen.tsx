import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
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
  Clock,
  ExternalLink,
  Filter
} from 'lucide-react';

// Import NetRunner search functionality
import { useNetRunnerSearch } from '../../NetRunner/hooks/useNetRunnerSearch';
import { SearchSource } from '../../NetRunner/types/netrunner';
import FilterPanel from '../../NetRunner/components/FilterPanel';
import EntityExtractor from '../../NetRunner/components/EntityExtractor';

/**
 * SearchScreen
 * 
 * Dedicated search interface for OSINT operations.
 * Extracted from NetRunner to provide focused search capabilities.
 */
const SearchScreen: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('all');
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

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          OSINT Search
        </Typography>
        <Button 
          variant="outlined"
          startIcon={<Filter />}
          onClick={toggleFilters}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>

      {/* Search Interface */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={isSearching ? <CircularProgress size={16} /> : <Search />}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Clock />}
              onClick={handleHistoryClick}
            >
              History
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Source Categories Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="source categories"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Sources" />
          <Tab label="Social Media" />
          <Tab label="News & Media" />
          <Tab label="Dark Web" />
          <Tab label="Technical" />
          <Tab label="Financial" />
        </Tabs>
      </Paper>

      {/* Filters Panel */}
      {showFilters && (
        <FilterPanel 
          filters={filters}
          onFiltersChange={setFilters}
          sources={sources}
          onSourcesChange={setSources}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}

      {/* Search Results */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {searchResults.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Results ({searchResults.length})
              </Typography>
              {searchResults.map((result, index) => (
                <Paper key={index} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {result.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {result.snippet}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Source: {result.source}
                    </Typography>
                    <Button 
                      size="small" 
                      startIcon={<ExternalLink size={14} />}
                      onClick={() => window.open(result.url, '_blank')}
                    >
                      View
                    </Button>
                  </Box>
                </Paper>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Entity Extraction */}
        {searchResults.length > 0 && (
          <EntityExtractor 
            searchResults={searchResults}
            onEntitiesExtracted={(entities) => console.log('Entities:', entities)}
          />
        )}
      </Box>

      {/* History Menu */}
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
  );
};

export default SearchScreen;
