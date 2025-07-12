import React, { useState } from 'react';
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
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import { 
  Search, 
  Clock,
  ExternalLink,
  Filter,
  TrendingUp,
  Eye,
  Shield,
  Zap,
  Download,
  Share2,
  BookOpen,
  AlertTriangle,
  Activity,
  Target,
  Globe,
  Users
} from 'lucide-react';

// Import NetRunner search functionality
import { useNetRunnerSearch } from '../../NetRunner/hooks/useNetRunnerSearch';
import { SearchSource } from '../../NetRunner/types/netrunner';
import FilterPanel from '../../NetRunner/components/FilterPanel';
import EntityExtractor from '../../NetRunner/components/EntityExtractor';

/**
 * Enhanced SearchScreen with Right-Side Intelligence Panel
 * 
 * Two-column layout:
 * - Left: Existing search interface (enhanced)
 * - Right: Intelligence summary, insights, and quick actions
 */
const SearchScreen: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('all');
  const [searchHistoryAnchor, setSearchHistoryAnchor] = useState<null | HTMLElement>(null);
  
  // Right panel state
  const [selectedInsight, setSelectedInsight] = useState<string>('overview');
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'search' | 'threat' | 'entity' | 'export';
    description: string;
    timestamp: string;
    severity?: 'low' | 'medium' | 'high';
  }>>([]);
  
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

  // Mock intelligence data that would update based on search activity
  const [intelligenceSummary, setIntelligenceSummary] = useState({
    totalSearches: 0,
    entitiesFound: 0,
    threatsDetected: 0,
    sourcesScanned: 0,
    lastUpdated: new Date().toISOString()
  });

  // Handle search submission
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Add activity entry
    const newActivity = {
      id: `activity-${Date.now()}`,
      type: 'search' as const,
      description: `Searched for "${searchQuery}"`,
      timestamp: new Date().toISOString()
    };
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
    
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
    
    // Update intelligence summary
    setIntelligenceSummary(prev => ({
      ...prev,
      totalSearches: prev.totalSearches + 1,
      entitiesFound: prev.entitiesFound + Math.floor(Math.random() * 5),
      sourcesScanned: sources.filter(s => s.checked).length,
      lastUpdated: new Date().toISOString()
    }));
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // If we have search results, automatically filter them by the new category
    if (searchResults.length > 0) {
      handleSearch();
    }
  };

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    const newActivity = {
      id: `activity-${Date.now()}`,
      type: action === 'export' ? 'export' as const : 'search' as const,
      description: `Executed ${action}`,
      timestamp: new Date().toISOString()
    };
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
    
    switch (action) {
      case 'export':
        // Handle export
        console.log('Exporting search results...');
        break;
      case 'share':
        // Handle share
        console.log('Sharing search session...');
        break;
      case 'advanced-search':
        // Open advanced search
        setShowFilters(true);
        break;
      default:
        console.log(`Quick action: ${action}`);
    }
  };

  // Generate threat indicators based on search activity
  const threatIndicators = [
    { level: 'low', description: 'Standard OSINT activity detected', count: 3 },
    { level: 'medium', description: 'Elevated search pattern', count: 1 },
    { level: 'high', description: 'Sensitive data exposure risk', count: 0 }
  ];

  return (
    <Box sx={{ 
      p: 3, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, rgba(10, 15, 25, 0.95) 0%, rgba(0, 20, 35, 0.95) 100%)',
      color: '#e0f0ff'
    }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ 
          color: '#00ccff',
          fontFamily: 'Aldrich, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          OSINT Search Operations
        </Typography>
        <Button 
          variant="outlined"
          startIcon={<Filter />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ 
            borderColor: '#00ccff',
            color: '#00ccff',
            '&:hover': { 
              borderColor: '#40d0ff',
              backgroundColor: 'rgba(0, 204, 255, 0.1)' 
            }
          }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Left Column - Search Interface */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* Search Interface */}
          <Paper elevation={3} sx={{ 
            p: 2, 
            mb: 2, 
            backgroundColor: 'rgba(0, 30, 50, 0.8)',
            border: '1px solid rgba(0, 204, 255, 0.2)'
          }}>
            <form onSubmit={handleSearch}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Enter search query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isSearching}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(0, 20, 35, 0.6)',
                      border: '1px solid rgba(0, 204, 255, 0.3)',
                      color: '#e0f0ff',
                      '&:hover': {
                        borderColor: 'rgba(0, 204, 255, 0.5)',
                      },
                      '&.Mui-focused': {
                        borderColor: '#00ccff',
                        boxShadow: '0 0 15px rgba(0, 204, 255, 0.2)'
                      }
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(224, 240, 255, 0.5)'
                    }
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSearching ? <CircularProgress size={16} /> : <Search />}
                  disabled={isSearching || !searchQuery.trim()}
                  sx={{
                    backgroundColor: '#00ccff',
                    color: '#0a0f19',
                    '&:hover': {
                      backgroundColor: '#40d0ff'
                    }
                  }}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Clock />}
                  onClick={(e) => setSearchHistoryAnchor(e.currentTarget)}
                  sx={{ 
                    borderColor: '#00ccff',
                    color: '#00ccff'
                  }}
                >
                  History
                </Button>
              </Box>
            </form>
          </Paper>

          {/* Source Categories Tabs */}
          <Paper sx={{ 
            mb: 2,
            backgroundColor: 'rgba(0, 30, 50, 0.8)',
            border: '1px solid rgba(0, 204, 255, 0.2)'
          }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="source categories"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(224, 240, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#00ccff'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#00ccff'
                }
              }}
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
              <Card sx={{ 
                mb: 2,
                backgroundColor: 'rgba(0, 30, 50, 0.8)',
                border: '1px solid rgba(0, 204, 255, 0.2)'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#00ccff' }}>
                    Search Results ({searchResults.length})
                  </Typography>
                  {searchResults.map((result, index) => (
                    <Paper key={index} sx={{ 
                      p: 2, 
                      mb: 1,
                      backgroundColor: 'rgba(0, 20, 35, 0.6)',
                      border: '1px solid rgba(0, 204, 255, 0.1)'
                    }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ color: '#e0f0ff' }}>
                        {result.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph sx={{ color: 'rgba(224, 240, 255, 0.7)' }}>
                        {result.snippet}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(224, 240, 255, 0.5)' }}>
                          Source: {result.source}
                        </Typography>
                        <Button 
                          size="small" 
                          startIcon={<ExternalLink size={14} />}
                          onClick={() => window.open(result.url, '_blank')}
                          sx={{ color: '#00ccff' }}
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
                onEntitiesExtracted={(entities) => {
                  const newActivity = {
                    id: `activity-${Date.now()}`,
                    type: 'entity' as const,
                    description: `${entities.length} entities extracted`,
                    timestamp: new Date().toISOString()
                  };
                  setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
                  setIntelligenceSummary(prev => ({
                    ...prev,
                    entitiesFound: prev.entitiesFound + entities.length
                  }));
                }}
              />
            )}
          </Box>
        </Grid>

        {/* Right Column - Intelligence Panel */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* Intelligence Summary */}
          <Paper elevation={3} sx={{ 
            p: 2, 
            mb: 2,
            backgroundColor: 'rgba(0, 30, 50, 0.8)',
            border: '1px solid rgba(0, 204, 255, 0.2)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              color: '#00ccff',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <TrendingUp size={20} />
              Intelligence Summary
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h4" sx={{ color: '#00ccff' }}>
                    {intelligenceSummary.totalSearches}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(224, 240, 255, 0.7)' }}>
                    Searches
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h4" sx={{ color: '#00ccff' }}>
                    {intelligenceSummary.entitiesFound}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(224, 240, 255, 0.7)' }}>
                    Entities
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h4" sx={{ color: '#00ccff' }}>
                    {intelligenceSummary.threatsDetected}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(224, 240, 255, 0.7)' }}>
                    Threats
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h4" sx={{ color: '#00ccff' }}>
                    {intelligenceSummary.sourcesScanned}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(224, 240, 255, 0.7)' }}>
                    Sources
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Quick Actions */}
          <Paper elevation={3} sx={{ 
            p: 2, 
            mb: 2,
            backgroundColor: 'rgba(0, 30, 50, 0.8)',
            border: '1px solid rgba(0, 204, 255, 0.2)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              color: '#00ccff',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Zap size={20} />
              Quick Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleQuickAction('export')}
                sx={{ 
                  borderColor: '#00ccff',
                  color: '#00ccff',
                  justifyContent: 'flex-start'
                }}
              >
                Export Results
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Share2 />}
                onClick={() => handleQuickAction('share')}
                sx={{ 
                  borderColor: '#00ccff',
                  color: '#00ccff',
                  justifyContent: 'flex-start'
                }}
              >
                Share Session
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Target />}
                onClick={() => handleQuickAction('advanced-search')}
                sx={{ 
                  borderColor: '#00ccff',
                  color: '#00ccff',
                  justifyContent: 'flex-start'
                }}
              >
                Advanced Search
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BookOpen />}
                onClick={() => handleQuickAction('investigation')}
                sx={{ 
                  borderColor: '#00ccff',
                  color: '#00ccff',
                  justifyContent: 'flex-start'
                }}
              >
                New Investigation
              </Button>
            </Box>
          </Paper>

          {/* Threat Indicators */}
          <Paper elevation={3} sx={{ 
            p: 2, 
            mb: 2,
            backgroundColor: 'rgba(0, 30, 50, 0.8)',
            border: '1px solid rgba(0, 204, 255, 0.2)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              color: '#00ccff',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Shield size={20} />
              Threat Indicators
            </Typography>
            
            {threatIndicators.map((threat, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AlertTriangle 
                    size={16} 
                    color={threat.level === 'high' ? '#ff4444' : threat.level === 'medium' ? '#ffaa00' : '#44ff44'}
                  />
                  <Typography variant="body2" sx={{ color: 'rgba(224, 240, 255, 0.8)' }}>
                    {threat.description}
                  </Typography>
                </Box>
                <Chip 
                  label={threat.count}
                  size="small"
                  sx={{ 
                    backgroundColor: threat.level === 'high' ? 'rgba(255, 68, 68, 0.2)' : 
                                   threat.level === 'medium' ? 'rgba(255, 170, 0, 0.2)' : 
                                   'rgba(68, 255, 68, 0.2)',
                    color: threat.level === 'high' ? '#ff4444' : 
                           threat.level === 'medium' ? '#ffaa00' : 
                           '#44ff44'
                  }}
                />
              </Box>
            ))}
          </Paper>

          {/* Recent Activity */}
          <Paper elevation={3} sx={{ 
            flex: 1,
            p: 2,
            backgroundColor: 'rgba(0, 30, 50, 0.8)',
            border: '1px solid rgba(0, 204, 255, 0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              color: '#00ccff',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Activity size={20} />
              Recent Activity
            </Typography>
            
            <List sx={{ overflow: 'auto', flex: 1 }}>
              {recentActivity.length > 0 ? recentActivity.map((activity) => (
                <ListItem key={activity.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {activity.type === 'search' && <Search size={16} color="#00ccff" />}
                    {activity.type === 'threat' && <AlertTriangle size={16} color="#ff4444" />}
                    {activity.type === 'entity' && <Users size={16} color="#44ff44" />}
                    {activity.type === 'export' && <Download size={16} color="#ffaa00" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.description}
                    secondary={new Date(activity.timestamp).toLocaleTimeString()}
                    primaryTypographyProps={{ 
                      sx: { 
                        color: 'rgba(224, 240, 255, 0.9)',
                        fontSize: '0.875rem'
                      }
                    }}
                    secondaryTypographyProps={{ 
                      sx: { 
                        color: 'rgba(224, 240, 255, 0.5)',
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                </ListItem>
              )) : (
                <ListItem>
                  <ListItemText
                    primary="No recent activity"
                    primaryTypographyProps={{ 
                      sx: { 
                        color: 'rgba(224, 240, 255, 0.5)',
                        textAlign: 'center'
                      }
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* History Menu */}
      <Menu
        anchorEl={searchHistoryAnchor}
        open={Boolean(searchHistoryAnchor)}
        onClose={() => setSearchHistoryAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 30, 50, 0.95)',
            border: '1px solid rgba(0, 204, 255, 0.2)'
          }
        }}
      >
        {searchHistory.length > 0 ? (
          searchHistory.map((query, index) => (
            <MenuItem 
              key={index} 
              onClick={() => {
                setSearchQuery(query);
                setSearchHistoryAnchor(null);
                setTimeout(() => handleSearch(), 0);
              }}
              sx={{ color: '#e0f0ff' }}
            >
              {query}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled sx={{ color: 'rgba(224, 240, 255, 0.5)' }}>
            No search history
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default SearchScreen;
