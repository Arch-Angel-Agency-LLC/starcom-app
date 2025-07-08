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
  Filter,
  Bot,
  ShoppingCart
} from 'lucide-react';

// Import custom hook for search functionality
import { useNetRunnerSearch } from './hooks/useNetRunnerSearch';
import { DashboardMode, SearchSource } from './types/netrunner';
import { IntelReport } from './models/IntelReport';
import FilterPanel from './components/FilterPanel';
import EntityExtractor from './components/EntityExtractor';
import PowerToolsPanel from './components/PowerToolsPanel';
import BotControlPanel from './components/BotControlPanel';
import WorkflowControlPanel from './components/WorkflowControlPanel';
import IntelMarketplacePanel from './components/IntelMarketplacePanel';
import UserMarketplaceDashboard from './components/UserMarketplaceDashboard';
import CreateListingForm from './components/CreateListingForm';
import MonitoringDashboard from './components/MonitoringDashboard';
import MonitoringPanel from './components/MonitoringPanel';
import IntelReportBuilder from './components/IntelReportBuilder';
import IntelAnalysisPanel from './components/IntelAnalysisPanel';

// Import tools and bots
import { netRunnerPowerTools } from './tools/NetRunnerPowerTools';
import { sampleBots } from './integration/BotRosterIntegration';
import { marketplaceDB } from './marketplace/MarketplaceDatabaseService';

/**
 * NetRunner Dashboard
 * 
 * Advanced online search and intelligence gathering dashboard.
 * This component serves as the main interface for the NetRunner module.
 * 
 * Features:
 * - Multi-source search capabilities
 * - Power tools integration for OSINT operations
 * - Bot automation integration with BotRoster
 * - Intel report creation and analysis
 * - Intelligence Exchange Marketplace integration
 * - Advanced filtering and visualization
 */
const NetRunnerDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<DashboardMode>('search');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchHistoryAnchor, setSearchHistoryAnchor] = useState<null | HTMLElement>(null);
  
  // Power tools and bots state
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [activeBots, setActiveBots] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('discovery');
  
  // Marketplace state
  const [showUserDashboard, setShowUserDashboard] = useState<boolean>(false);
  const [showCreateListing, setShowCreateListing] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<IntelReport | null>(null);
  
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant={activeMode === 'search' || activeMode === 'advanced' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleModeChange(activeMode === 'search' ? 'advanced' : 'search')}
            startIcon={<Search />}
          >
            Search
          </Button>
          <Button 
            variant={activeMode === 'powertools' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleModeChange('powertools')}
            startIcon={<Database />}
          >
            Power Tools
          </Button>
          <Button 
            variant={activeMode === 'bots' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleModeChange('bots')}
            startIcon={<Bot size={16} />}
          >
            Bots
          </Button>
          <Button 
            variant={activeMode === 'analysis' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleModeChange('analysis')}
            startIcon={<BarChart2 />}
          >
            Analysis
          </Button>
          <Button 
            variant={activeMode === 'marketplace' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleModeChange('marketplace')}
            startIcon={<ShoppingCart size={16} />}
          >
            Market
          </Button>
          <Button 
            variant={activeMode === 'monitoring' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleModeChange('monitoring')}
            startIcon={<Clock size={16} />}
          >
            Monitor
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleSettingsClick}
            startIcon={<Settings />}
            sx={{ ml: 2 }}
          >
            Settings
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
        {/* Main content area */}
        {(activeMode === 'search' || activeMode === 'advanced') && (
          <>
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
              />
            </Box>
          </>
        )}

        {/* Power Tools Mode */}
        {activeMode === 'powertools' && (
          <Box sx={{ flex: 1 }}>
            <PowerToolsPanel 
              tools={netRunnerPowerTools}
              selectedTools={selectedTools}
              onToolSelect={(toolId) => setSelectedTools(prev => 
                prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
              )}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </Box>
        )}

        {/* Bot Automation Mode */}
        {activeMode === 'bots' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            {/* Bot Control Panel for immediate bot actions */}
            <BotControlPanel 
              bots={sampleBots}
              activeBots={activeBots}
              onBotActivate={(botId) => setActiveBots(prev => 
                prev.includes(botId) ? prev.filter(id => id !== botId) : [...prev, botId]
              )}
              tools={netRunnerPowerTools}
            />
            
            {/* Workflow Control Panel for automated workflows */}
            <WorkflowControlPanel
              bots={sampleBots}
              tools={netRunnerPowerTools}
            />
          </Box>
        )}

        {/* Marketplace Mode */}
        {activeMode === 'marketplace' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            {showCreateListing && selectedReport ? (
              <CreateListingForm 
                report={selectedReport}
                onListingCreated={(listing) => {
                  console.log('Listing created:', listing);
                  setShowCreateListing(false);
                  setSelectedReport(null);
                  // Here we would add the listing to a local state or database
                }}
                onCancel={() => {
                  setShowCreateListing(false);
                  setSelectedReport(null);
                }}
              />
            ) : showUserDashboard ? (
              <UserMarketplaceDashboard 
                onCreateListing={() => {
                  // In a real implementation, this would show a report selection UI
                  // For now, we'll create a dummy report
                  const dummyReport: IntelReport = {
                    id: '12345',
                    title: 'Sample Intelligence Report',
                    subtitle: 'Demo Report',
                    summary: 'This is a sample intelligence report for demonstration purposes.',
                    description: 'Detailed description would go here...',
                    content: [
                      {
                        id: 'content1',
                        title: 'Sample Content',
                        type: 'text',
                        content: 'Detailed content would go here...',
                        order: 1
                      }
                    ],
                    classification: 'CONFIDENTIAL',
                    verificationLevel: 'CONFIRMED',
                    sources: [
                      { id: 'src1', name: 'Source 1', type: 'open_source', reliability: 'A' }
                    ],
                    entities: [
                      { id: 'ent1', name: 'Test Entity', type: 'organization', confidence: 0.9, sources: ['src1'] }
                    ],
                    relationships: [],
                    evidence: [],
                    intelTypes: ['network', 'identity'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    author: 'current-user',
                    authorName: 'Current User',
                    marketValue: 100,
                    tradable: true,
                    exchangeStatus: 'DRAFT',
                    hash: 'sample-hash-12345',
                    encryptionStatus: 'UNENCRYPTED',
                    tags: ['sample', 'test', 'demonstration'],
                    categories: ['demo']
                  };
                  
                  setSelectedReport(dummyReport);
                  setShowCreateListing(true);
                }}
                onEditListing={(listing) => console.log('Edit listing:', listing)}
                onViewDetails={(listing) => console.log('View listing details:', listing)}
              />
            ) : (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button 
                    variant="contained"
                    startIcon={<ShoppingCart size={16} />}
                    onClick={() => setShowUserDashboard(true)}
                  >
                    My Marketplace
                  </Button>
                </Box>
                
                <IntelMarketplacePanel 
                  listings={marketplaceDB.searchListings({})}
                  onPurchase={(listing) => console.log('Purchase listing:', listing)}
                  onViewDetails={(listing) => console.log('View listing details:', listing)}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Monitoring Mode */}
        {activeMode === 'monitoring' && (
          <Box sx={{ flex: 1 }}>
            {/* Use existing MonitoringDashboard but pass props for integrating the advanced panel */}
            <MonitoringDashboard 
              onCreateMonitor={(monitor) => console.log('Create monitor:', monitor)}
              onDeleteMonitor={(monitorId) => console.log('Delete monitor:', monitorId)}
              onToggleMonitor={(monitorId, active) => console.log('Toggle monitor:', monitorId, active)}
              renderAdvancedPanel={() => (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>Advanced Monitoring System</Typography>
                  <Paper sx={{ p: 2 }}>
                    <MonitoringPanel 
                      onTargetSelect={(targetId) => console.log('Target selected:', targetId)}
                    />
                  </Paper>
                </Box>
              )}
            />
          </Box>
        )}
      </Box>
      
      {/* Power Tools Panel - New addition */}
      {activeMode === 'advanced' && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Power Tools
          </Typography>
          <PowerToolsPanel 
            tools={netRunnerPowerTools}
            selectedTools={[]}
            onToolSelect={(toolId) => console.log('Tool selected:', toolId)}
            activeCategory="all"
            onCategoryChange={(category) => console.log('Category changed:', category)}
          />
        </Paper>
      )}
      
      {/* Bot Control Panel - New addition */}
      {activeMode === 'advanced' && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Bot Control
          </Typography>
          <BotControlPanel 
            bots={sampleBots}
            activeBots={[]}
            onBotActivate={(botId) => console.log('Bot activated:', botId)}
            tools={netRunnerPowerTools}
          />
        </Paper>
      )}
      
      {/* Intel Analysis Panel - New addition */}
      {activeMode === 'analysis' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <IntelAnalysisPanel 
            searchResults={searchResults}
            onPackageCreated={(analysisResult) => {
              console.log('Analysis package created:', analysisResult);
              // Here we could save the analysis result to state or database
              // and notify the user that the analysis is complete
              
              // Example of showing a notification (would need to implement this):
              // showNotification({
              //   title: 'Analysis Complete',
              //   message: `Created ${analysisResult.packageType} package with ${analysisResult.entities.length} entities`,
              //   type: 'success'
              // });
            }}
          />
          
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Intelligence Report Builder
            </Typography>
            <IntelReportBuilder 
              searchResults={searchResults}
              onCreateReport={(report) => console.log('Report created:', report)}
              onSaveDraft={(report) => console.log('Draft saved:', report)}
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default NetRunnerDashboard;
