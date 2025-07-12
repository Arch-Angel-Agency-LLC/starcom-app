import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  Bookmark,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  Star,
  Eye,
  Bitcoin,
  Shield
} from 'lucide-react';

// Market Data Interfaces
interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
  type: 'crypto' | 'stock' | 'commodity' | 'intelligence';
}

// Intelligence Marketplace Interface
interface IntelListing {
  id: string;
  title: string;
  description: string;
  category: 'osint' | 'sigint' | 'humint' | 'geoint' | 'finint';
  price: number;
  currency: 'USD' | 'BTC' | 'ETH' | 'CREDITS';
  seller: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
  };
  tags: string[];
  createdAt: string;
  expiresAt?: string;
  downloads: number;
  rating: number;
  reviews: number;
}

// Portfolio Interface
interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MarketExchangeApplication: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);
  const [intelListings, setIntelListings] = useState<IntelListing[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);

  // Load market data
  useEffect(() => {
    const loadMarketData = async () => {
      setLoading(true);
      try {
        // Simulate API call - replace with actual data loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock market assets
        const mockAssets: MarketAsset[] = [
          {
            id: 'BTC',
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 42350.80,
            change24h: 2.45,
            volume24h: 28540000000,
            marketCap: 830200000000,
            lastUpdated: new Date().toISOString(),
            type: 'crypto'
          },
          {
            id: 'ETH',
            symbol: 'ETH',
            name: 'Ethereum',
            price: 2890.45,
            change24h: -1.23,
            volume24h: 15240000000,
            marketCap: 347800000000,
            lastUpdated: new Date().toISOString(),
            type: 'crypto'
          },
          {
            id: 'INTEL-001',
            symbol: 'INTEL-001',
            name: 'Cyber Threat Intelligence Package',
            price: 299.99,
            change24h: 15.7,
            volume24h: 1250000,
            marketCap: 12500000,
            lastUpdated: new Date().toISOString(),
            type: 'intelligence'
          }
        ];

        // Mock intelligence listings
        const mockListings: IntelListing[] = [
          {
            id: 'listing1',
            title: 'Advanced Persistent Threat Analysis - Q4 2024',
            description: 'Comprehensive analysis of recent APT activities targeting financial institutions',
            category: 'sigint',
            price: 1299.99,
            currency: 'USD',
            seller: {
              id: 'seller1',
              name: 'CyberIntel Pro',
              rating: 4.8,
              verified: true
            },
            tags: ['apt', 'financial', 'malware', 'attribution'],
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            downloads: 47,
            rating: 4.9,
            reviews: 23
          },
          {
            id: 'listing2',
            title: 'OSINT Collection: Social Media Monitoring',
            description: 'Real-time social media intelligence gathering tools and methodologies',
            category: 'osint',
            price: 0.5,
            currency: 'BTC',
            seller: {
              id: 'seller2',
              name: 'DataHunter',
              rating: 4.6,
              verified: true
            },
            tags: ['osint', 'social-media', 'monitoring', 'automation'],
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            downloads: 128,
            rating: 4.7,
            reviews: 56
          }
        ];

        // Mock portfolio
        const mockPortfolio: PortfolioAsset[] = [
          {
            id: 'btc-holding',
            symbol: 'BTC',
            name: 'Bitcoin',
            quantity: 0.25,
            averagePrice: 38500,
            currentPrice: 42350.80,
            totalValue: 10587.70,
            pnl: 962.70,
            pnlPercent: 10.0
          },
          {
            id: 'intel-holding',
            symbol: 'INTEL-001',
            name: 'Intelligence Credits',
            quantity: 50,
            averagePrice: 250,
            currentPrice: 299.99,
            totalValue: 14999.50,
            pnl: 2499.50,
            pnlPercent: 20.0
          }
        ];

        setMarketAssets(mockAssets);
        setIntelListings(mockListings);
        setPortfolio(mockPortfolio);
      } catch (error) {
        console.error('Error loading market data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarketData();
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Get trend icon and color
  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp size={16} style={{ color: '#4CAF50' }} />;
    } else if (change < 0) {
      return <TrendingDown size={16} style={{ color: '#F44336' }} />;
    }
    return <Activity size={16} style={{ color: '#9E9E9E' }} />;
  };

  // Format currency
  const formatCurrency = (amount: number, symbol: string = '$') => {
    return `${symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    const color = percent >= 0 ? '#4CAF50' : '#F44336';
    const sign = percent >= 0 ? '+' : '';
    return (
      <Typography 
        variant="body2" 
        sx={{ color, fontWeight: 'bold' }}
      >
        {sign}{percent.toFixed(2)}%
      </Typography>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Market Data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        {/* Market Overview Stats */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  Total Portfolio Value
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(portfolio.reduce((sum, asset) => sum + asset.totalValue, 0))}
                </Typography>
                <Typography variant="body2" color="success.main">
                  +{formatCurrency(portfolio.reduce((sum, asset) => sum + asset.pnl, 0))} (24h)
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  Active Listings
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {intelListings.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Intelligence products
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  Market Cap
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  $1.2T
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total market
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  24h Volume
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  $45.2B
                </Typography>
                <Typography variant="body2" color="success.main">
                  +12.4%
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Markets" icon={<BarChart3 size={20} />} />
          <Tab label="Intelligence Marketplace" icon={<ShoppingCart size={20} />} />
          <Tab label="Portfolio" icon={<PieChart size={20} />} />
          <Tab label="Trading" icon={<TrendingUp size={20} />} />
          <Tab label="Analytics" icon={<Activity size={20} />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
        {/* Markets Tab */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">24h Change</TableCell>
                  <TableCell align="right">Volume</TableCell>
                  <TableCell align="right">Market Cap</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marketAssets.map((asset) => (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {asset.type === 'crypto' ? <Bitcoin size={24} /> : <Shield size={24} />}
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {asset.symbol}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(asset.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        {getTrendIcon(asset.change24h)}
                        {formatPercent(asset.change24h)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(asset.volume24h)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(asset.marketCap)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsTradeDialogOpen(true);
                        }}
                      >
                        Trade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Intelligence Marketplace Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {intelListings.map((listing) => (
              <Box key={listing.id} sx={{ flex: '1 1 400px', minWidth: 400 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {listing.title}
                      </Typography>
                      {listing.seller.verified && (
                        <Chip 
                          icon={<CheckCircle size={16} />} 
                          label="Verified" 
                          size="small" 
                          color="success" 
                        />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {listing.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={listing.category} size="small" color="primary" />
                      {listing.tags.slice(0, 3).map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {listing.price} {listing.currency}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star size={16} style={{ color: '#FFD700' }} />
                        <Typography variant="body2">
                          {listing.rating} ({listing.reviews})
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Seller: {listing.seller.name} • {listing.downloads} downloads
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<Eye />}>Preview</Button>
                    <Button size="small" variant="contained" startIcon={<ShoppingCart />}>
                      Purchase
                    </Button>
                    <IconButton size="small">
                      <Bookmark />
                    </IconButton>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        </TabPanel>

        {/* Portfolio Tab */}
        <TabPanel value={activeTab} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Avg Price</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolio.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {asset.symbol}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {asset.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{asset.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(asset.averagePrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(asset.currentPrice)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(asset.totalValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: asset.pnl >= 0 ? '#4CAF50' : '#F44336',
                            fontWeight: 'bold'
                          }}
                        >
                          {asset.pnl >= 0 ? '+' : ''}{formatCurrency(asset.pnl)}
                        </Typography>
                        {formatPercent(asset.pnlPercent)}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="outlined">
                        Sell
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Trading Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Trade
                </Typography>
                {/* Trading form would go here */}
                <Alert severity="info" sx={{ mt: 2 }}>
                  Advanced trading features coming soon. Use the Markets tab to place basic orders.
                </Alert>
              </Paper>
            </Box>
            <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No recent orders found.
                </Typography>
              </Paper>
            </Box>
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Analytics
                </Typography>
                <Alert severity="info">
                  Advanced analytics dashboard with charts and insights coming soon.
                </Alert>
              </Paper>
            </Box>
          </Box>
        </TabPanel>
      </Box>

      {/* Trade Dialog */}
      <Dialog open={isTradeDialogOpen} onClose={() => setIsTradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Trade {selectedAsset?.symbol}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current Price: {selectedAsset ? formatCurrency(selectedAsset.price) : 'N/A'}
          </Typography>
          <Alert severity="info">
            Trading functionality will be implemented in the next phase.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTradeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled>Place Order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketExchangeApplication;
