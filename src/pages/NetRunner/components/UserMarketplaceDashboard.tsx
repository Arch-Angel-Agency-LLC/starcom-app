/**
 * UserMarketplaceDashboard.tsx
 * 
 * Component for displaying and managing a user's marketplace activity,
 * including listings, purchases, and sales.
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  Divider, 
  Card, 
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  ShoppingCart, 
  DollarSign, 
  Tag,
  Eye,
  Edit,
  Trash2,
  BarChart2,
  ListOrdered,
  RefreshCw,
  Star,
  Clock,
  BarChart,
  Heart
} from 'lucide-react';

import { IntelListingEntry, IntelTransaction } from '../marketplace/IntelligenceExchange';
import { getUserListings, deleteListing } from '../marketplace/ListingManager';
import { getUserTransactions } from '../marketplace/TransactionService';
import { getUserMarketStats } from '../marketplace/TransactionService';

interface UserMarketplaceDashboardProps {
  onCreateListing?: () => void;
  onEditListing?: (listing: IntelListingEntry) => void;
  onViewDetails?: (listing: IntelListingEntry) => void;
}

/**
 * Dashboard for managing a user's marketplace activity
 */
const UserMarketplaceDashboard: React.FC<UserMarketplaceDashboardProps> = ({
  onCreateListing,
  onEditListing,
  onViewDetails
}) => {
  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data - in a real implementation, this would come from the services
  const [userListings, setUserListings] = useState<IntelListingEntry[]>([]);
  const [userTransactions, setUserTransactions] = useState<IntelTransaction[]>([]);
  const [marketStats, setMarketStats] = useState(getUserMarketStats());
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Refresh user data
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, these would be actual API calls
      const listings = getUserListings();
      const transactions = getUserTransactions();
      const stats = getUserMarketStats();
      
      setUserListings(listings);
      setUserTransactions(transactions);
      setMarketStats(stats);
    } catch (error) {
      console.error('Error fetching user market data:', error);
      setError(`Failed to load data: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle listing deletion
  const handleDeleteListing = async (listingId: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      setIsLoading(true);
      
      try {
        const success = deleteListing(listingId);
        
        if (success) {
          // Remove from local state
          setUserListings(userListings.filter(listing => listing.id !== listingId));
        } else {
          throw new Error('Failed to delete listing');
        }
      } catch (error) {
        console.error('Error deleting listing:', error);
        setError(`Failed to delete listing: ${(error as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Classification level colors
  const classificationColors: Record<string, 'default' | 'info' | 'warning' | 'error' | 'secondary'> = {
    'UNCLASSIFIED': 'default',
    'CONFIDENTIAL': 'info',
    'SECRET': 'warning',
    'TOP_SECRET': 'error',
    'COSMIC': 'secondary'
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingCart size={20} style={{ marginRight: '8px' }} />
            My Marketplace
          </Typography>
          
          <Box>
            <Button 
              variant="outlined"
              size="small"
              onClick={refreshData}
              startIcon={<RefreshCw size={16} />}
              sx={{ mr: 1 }}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button 
              variant="contained"
              size="small"
              onClick={onCreateListing}
              startIcon={<ShoppingCart size={16} />}
              disabled={isLoading}
            >
              Create Listing
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage your intelligence marketplace listings, track sales, and view purchase history.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="My Listings" />
          <Tab label="Transactions" />
          <Tab label="Market Stats" />
        </Tabs>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* My Listings Tab */}
        {activeTab === 0 && (
          <Box>
            {userListings.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {userListings.map(listing => (
                  <Card key={listing.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6">{listing.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Listed: {formatDate(listing.listedAt)}
                            {listing.expiresAt && ` • Expires: ${formatDate(listing.expiresAt)}`}
                          </Typography>
                        </Box>
                        <Chip 
                          label={listing.status.toUpperCase()}
                          color={listing.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {listing.summary}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          label={`$${listing.price}`}
                          icon={<DollarSign size={14} />}
                          size="small"
                          color="primary"
                        />
                        <Chip 
                          label={listing.pricingModel}
                          size="small"
                        />
                        <Chip 
                          label={listing.classification}
                          size="small"
                          color={classificationColors[listing.classification]}
                        />
                        {listing.tags.slice(0, 3).map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            icon={<Tag size={14} />}
                          />
                        ))}
                        {listing.tags.length > 3 && (
                          <Chip 
                            label={`+${listing.tags.length - 3} more`} 
                            size="small" 
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Tooltip title="Views">
                          <Chip 
                            icon={<Eye size={14} />}
                            label={listing.views}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                        <Tooltip title="Favorites">
                          <Chip 
                            icon={<Heart size={14} />}
                            label={listing.favorites}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                      <Button 
                        size="small"
                        startIcon={<Eye size={16} />}
                        onClick={() => onViewDetails && onViewDetails(listing)}
                      >
                        View
                      </Button>
                      <Button 
                        size="small"
                        startIcon={<Edit size={16} />}
                        onClick={() => onEditListing && onEditListing(listing)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small"
                        color="error"
                        startIcon={<Trash2 size={16} />}
                        onClick={() => handleDeleteListing(listing.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>No Listings Yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You haven't created any marketplace listings yet.
                </Typography>
                <Button 
                  variant="contained"
                  onClick={onCreateListing}
                  startIcon={<ShoppingCart size={16} />}
                >
                  Create Your First Listing
                </Button>
              </Box>
            )}
          </Box>
        )}
        
        {/* Transactions Tab */}
        {activeTab === 1 && (
          <Box>
            {userTransactions.length > 0 ? (
              <List>
                {userTransactions.map(transaction => (
                  <ListItem 
                    key={transaction.id}
                    secondaryAction={
                      <Chip 
                        label={transaction.status.toUpperCase()}
                        color={
                          transaction.status === 'completed' ? 'success' :
                          transaction.status === 'pending' ? 'warning' :
                          transaction.status === 'disputed' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    }
                    sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1 }}
                  >
                    <ListItemText 
                      primary={`Transaction #${transaction.id.substring(0, 8)}`}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {transaction.buyerId === 'current-user-id' ? 'Purchase' : 'Sale'} - ${transaction.price}
                          </Typography>
                          <Typography variant="caption" component="div" color="text.secondary">
                            {formatDate(transaction.createdAt)}
                            {transaction.completedAt && ` • Completed: ${formatDate(transaction.completedAt)}`}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>No Transactions Yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven't made any purchases or sales in the marketplace yet.
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        {/* Market Stats Tab */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
              <Paper elevation={2} sx={{ p: 2, flex: '1 1 calc(33% - 16px)', minWidth: 180 }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <DollarSign size={20} style={{ marginRight: '8px' }} />
                  ${marketStats.totalEarned}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Earned
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 2, flex: '1 1 calc(33% - 16px)', minWidth: 180 }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListOrdered size={20} style={{ marginRight: '8px' }} />
                  {marketStats.totalSales}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sales
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 2, flex: '1 1 calc(33% - 16px)', minWidth: 180 }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChart size={20} style={{ marginRight: '8px' }} />
                  {marketStats.activeSales}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Listings
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 2, flex: '1 1 calc(33% - 16px)', minWidth: 180 }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCart size={20} style={{ marginRight: '8px' }} />
                  {marketStats.totalPurchases}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Purchases
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 2, flex: '1 1 calc(33% - 16px)', minWidth: 180 }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <DollarSign size={20} style={{ marginRight: '8px' }} />
                  ${marketStats.totalSpent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Spent
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 2, flex: '1 1 calc(33% - 16px)', minWidth: 180 }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Star size={20} style={{ marginRight: '8px' }} />
                  {marketStats.averageRating}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </Paper>
            </Box>
            
            <Alert severity="info">
              These statistics represent your marketplace activity. Keep creating high-quality
              intelligence reports to improve your rating and earnings.
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UserMarketplaceDashboard;
