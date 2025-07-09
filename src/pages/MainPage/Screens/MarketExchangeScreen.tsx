import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button
} from '@mui/material';
import { 
  ShoppingCart, 
  TrendingUp, 
  Bookmark, 
  User 
} from 'lucide-react';

// Import NetRunner marketplace components
import IntelMarketplacePanel from '../../NetRunner/components/IntelMarketplacePanel';
import UserMarketplaceDashboard from '../../NetRunner/components/UserMarketplaceDashboard';
import CreateListingForm from '../../NetRunner/components/CreateListingForm';
import { marketplaceDB } from '../../NetRunner/marketplace/MarketplaceDatabaseService';
import { IntelReport } from '../../NetRunner/models/IntelReport';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `market-tab-${index}`,
    'aria-controls': `market-tabpanel-${index}`,
  };
}

/**
 * MarketExchangeScreen
 * 
 * Intelligence marketplace where users can buy, sell, and trade intelligence reports.
 * This is the main marketplace interface separated from NetRunner.
 */
const MarketExchangeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IntelReport | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Create a dummy report for demonstration
  const createDummyReport = (): IntelReport => ({
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
  });

  const handleCreateListing = () => {
    setSelectedReport(createDummyReport());
    setShowCreateListing(true);
  };

  if (showCreateListing && selectedReport) {
    return (
      <Box sx={{ p: 3, height: '100%' }}>
        <CreateListingForm 
          report={selectedReport}
          onListingCreated={(listing) => {
            console.log('Listing created:', listing);
            setShowCreateListing(false);
            setSelectedReport(null);
          }}
          onCancel={() => {
            setShowCreateListing(false);
            setSelectedReport(null);
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          MarketExchange
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Intelligence Marketplace & Trading Platform
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="marketplace tabs"
          variant="fullWidth"
        >
          <Tab 
            label="Browse Market" 
            icon={<ShoppingCart size={16} />} 
            iconPosition="start"
            {...a11yProps(0)} 
          />
          <Tab 
            label="Market Analytics" 
            icon={<TrendingUp size={16} />} 
            iconPosition="start"
            {...a11yProps(1)} 
          />
          <Tab 
            label="My Listings" 
            icon={<User size={16} />} 
            iconPosition="start"
            {...a11yProps(2)} 
          />
          <Tab 
            label="Watchlist" 
            icon={<Bookmark size={16} />} 
            iconPosition="start"
            {...a11yProps(3)} 
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Browse Market Tab */}
        <TabPanel value={activeTab} index={0}>
          <IntelMarketplacePanel 
            listings={marketplaceDB.searchListings({})}
            onPurchase={(listing) => console.log('Purchase listing:', listing)}
            onViewDetails={(listing) => console.log('View listing details:', listing)}
          />
        </TabPanel>

        {/* Market Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Market Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Market analytics and trends will be displayed here.
          </Typography>
        </TabPanel>

        {/* My Listings Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              My Listings
            </Typography>
            <Button 
              variant="contained"
              startIcon={<ShoppingCart size={16} />}
              onClick={handleCreateListing}
            >
              Create New Listing
            </Button>
          </Box>
          
          <UserMarketplaceDashboard 
            onCreateListing={handleCreateListing}
            onEditListing={(listing) => console.log('Edit listing:', listing)}
            onViewDetails={(listing) => console.log('View listing details:', listing)}
          />
        </TabPanel>

        {/* Watchlist Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Watchlist
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your watched listings will be displayed here.
          </Typography>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default MarketExchangeScreen;
