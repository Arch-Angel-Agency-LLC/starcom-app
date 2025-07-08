/**
 * IntelMarketplacePanel.tsx
 * 
 * Component for displaying and interacting with the Intelligence Exchange Marketplace.
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  CardActions
} from '@mui/material';
import { 
  ShoppingCart, 
  Search, 
  Clock,
  Star,
  Eye,
  Heart as HeartIcon,
  FileText,
  TrendingUp,
  Filter
} from 'lucide-react';

import { 
  IntelListingEntry, 
  filterListings,
  initialMarketMetrics
} from '../marketplace/IntelligenceExchange';
import { ClassificationLevel, VerificationLevel } from '../models/IntelReport';
import { IntelType } from '../tools/NetRunnerPowerTools';

interface IntelMarketplacePanelProps {
  listings: IntelListingEntry[];
  onPurchase?: (listing: IntelListingEntry) => void;
  onViewDetails?: (listing: IntelListingEntry) => void;
}

/**
 * IntelMarketplacePanel displays the Intelligence Exchange Marketplace interface
 */
const IntelMarketplacePanel: React.FC<IntelMarketplacePanelProps> = ({
  listings,
  onPurchase,
  onViewDetails
}) => {
  // State for filters and display
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedVerification, setSelectedVerification] = useState<VerificationLevel | ''>('');
  const [selectedClassification, setSelectedClassification] = useState<ClassificationLevel | ''>('');
  const [selectedIntelTypes, setSelectedIntelTypes] = useState<IntelType[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Apply filters to the listings
  const filteredListings = filterListings(listings, {
    ...(selectedVerification && { minVerification: selectedVerification }),
    ...(selectedClassification && { maxClassification: selectedClassification }),
    ...(selectedIntelTypes.length > 0 && { intelTypes: selectedIntelTypes }),
    ...(minPrice && { minPrice: Number(minPrice) }),
    ...(maxPrice && { maxPrice: Number(maxPrice) }),
    sortBy: sortBy as 'price' | 'date' | 'rating' | 'popularity',
    sortDirection
  });
  
  // Search results (simple title/summary matching)
  const searchResults = searchQuery.trim() 
    ? filteredListings.filter(listing => 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredListings;
  
  // Classification level colors
  const classificationColors: Record<ClassificationLevel, 'default' | 'info' | 'warning' | 'error' | 'secondary'> = {
    'UNCLASSIFIED': 'default',
    'CONFIDENTIAL': 'info',
    'SECRET': 'warning',
    'TOP_SECRET': 'error',
    'COSMIC': 'secondary'
  };
  
  // Verification level colors
  const verificationColors: Record<VerificationLevel, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    'UNVERIFIED': 'default',
    'SINGLE_SOURCE': 'info',
    'MULTI_SOURCE': 'success',
    'CONFIRMED': 'warning',
    'VALIDATED': 'error'
  };
  
  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedVerification('');
    setSelectedClassification('');
    setSelectedIntelTypes([]);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('date');
    setSortDirection('desc');
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
            Intelligence Exchange
            <Chip 
              label={`${searchResults.length} ${searchResults.length === 1 ? 'Listing' : 'Listings'}`} 
              size="small" 
              sx={{ ml: 2 }} 
            />
          </Typography>
          
          <Box>
            <Button 
              variant="outlined"
              size="small"
              onClick={toggleFilters}
              startIcon={<Filter size={16} />}
              sx={{ mr: 1 }}
            >
              Filters
            </Button>
            <Button 
              variant="outlined"
              size="small"
              startIcon={<TrendingUp size={16} />}
            >
              Market Stats
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Browse and purchase intelligence reports from the marketplace.
          Intel is a valuable commodity in the Starcom ecosystem.
        </Typography>
        
        {/* Search bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for intel by title, summary, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            )
          }}
        />
        
        {/* Filters panel */}
        {showFilters && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Filter Listings</Typography>
              <Button 
                size="small" 
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {/* Verification level filter */}
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Verification Level</InputLabel>
                <Select
                  value={selectedVerification}
                  label="Verification Level"
                  onChange={(e) => setSelectedVerification(e.target.value as VerificationLevel)}
                >
                  <MenuItem value="">Any Level</MenuItem>
                  <MenuItem value="UNVERIFIED">UNVERIFIED</MenuItem>
                  <MenuItem value="SINGLE_SOURCE">SINGLE SOURCE</MenuItem>
                  <MenuItem value="MULTI_SOURCE">MULTI SOURCE</MenuItem>
                  <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
                  <MenuItem value="VALIDATED">VALIDATED</MenuItem>
                </Select>
              </FormControl>
              
              {/* Classification level filter */}
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Classification</InputLabel>
                <Select
                  value={selectedClassification}
                  label="Classification"
                  onChange={(e) => setSelectedClassification(e.target.value as ClassificationLevel)}
                >
                  <MenuItem value="">Any Classification</MenuItem>
                  <MenuItem value="UNCLASSIFIED">UNCLASSIFIED</MenuItem>
                  <MenuItem value="CONFIDENTIAL">CONFIDENTIAL</MenuItem>
                  <MenuItem value="SECRET">SECRET</MenuItem>
                  <MenuItem value="TOP_SECRET">TOP SECRET</MenuItem>
                  <MenuItem value="COSMIC">COSMIC</MenuItem>
                </Select>
              </FormControl>
              
              {/* Intel type filter */}
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Intel Types</InputLabel>
                <Select
                  multiple
                  value={selectedIntelTypes}
                  input={<OutlinedInput label="Intel Types" />}
                  onChange={(e) => setSelectedIntelTypes(e.target.value as IntelType[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="identity">Identity</MenuItem>
                  <MenuItem value="network">Network</MenuItem>
                  <MenuItem value="financial">Financial</MenuItem>
                  <MenuItem value="geospatial">Geospatial</MenuItem>
                  <MenuItem value="social">Social</MenuItem>
                  <MenuItem value="infrastructure">Infrastructure</MenuItem>
                  <MenuItem value="vulnerability">Vulnerability</MenuItem>
                  <MenuItem value="darkweb">Dark Web</MenuItem>
                  <MenuItem value="threat">Threat</MenuItem>
                  <MenuItem value="temporal">Temporal</MenuItem>
                </Select>
              </FormControl>
              
              {/* Price range filters */}
              <TextField
                label="Min Price"
                type="number"
                size="small"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                sx={{ width: 120 }}
              />
              <TextField
                label="Max Price"
                type="number"
                size="small"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                sx={{ width: 120 }}
              />
              
              {/* Sort options */}
              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="date">Date Listed</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="rating">Seller Rating</MenuItem>
                  <MenuItem value="popularity">Popularity</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel>Direction</InputLabel>
                <Select
                  value={sortDirection}
                  label="Direction"
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                >
                  <MenuItem value="desc">Descending</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        )}
        
        {/* Market metrics summary */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          justifyContent: 'space-between',
          mb: 3,
          p: 2,
          bgcolor: 'rgba(0,0,0,0.02)',
          borderRadius: 1
        }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Total Volume</Typography>
            <Typography variant="h6">{initialMarketMetrics.totalVolume.toLocaleString()} SC</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Active Listings</Typography>
            <Typography variant="h6">{initialMarketMetrics.activeListings}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Avg. Price</Typography>
            <Typography variant="h6">{initialMarketMetrics.averagePrice.toLocaleString()} SC</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Recent Transactions</Typography>
            <Typography variant="h6">{initialMarketMetrics.recentTransactions}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Top Category</Typography>
            <Typography variant="h6">{initialMarketMetrics.topCategories[0]?.category}</Typography>
          </Box>
        </Box>
        
        {/* Listings */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
          {searchResults.length > 0 ? (
            searchResults.map(listing => (
              <Box key={listing.id} sx={{ gridColumn: {xs: 'span 12', sm: 'span 6', md: 'span 4'} }}>
                <Card 
                  elevation={1}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {listing.title}
                      </Typography>
                      <Chip 
                        label={listing.classification}
                        size="small"
                        color={classificationColors[listing.classification]}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Clock size={14} style={{ marginRight: 4 }} />
                        {formatDate(listing.listedAt)}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <Star size={14} style={{ marginRight: 4 }} />
                        {listing.sellerRating}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {listing.summary}
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {listing.intelTypes.map((type, index) => (
                        <Chip 
                          key={index}
                          label={type}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        label={`Verification: ${listing.verificationLevel.replace('_', ' ')}`}
                        size="small"
                        color={verificationColors[listing.verificationLevel]}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          <Eye size={14} style={{ marginRight: 2 }} />
                          {listing.views}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                          <HeartIcon size={14} style={{ marginRight: 2 }} />
                          {listing.favorites}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ 
                    bgcolor: 'rgba(0,0,0,0.03)', 
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    justifyContent: 'space-between',
                    p: 2
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {listing.price.toLocaleString()} SC
                    </Typography>
                    
                    <Box>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => onViewDetails && onViewDetails(listing)}
                        sx={{ mr: 1 }}
                      >
                        Details
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="primary"
                        onClick={() => onPurchase && onPurchase(listing)}
                        startIcon={<ShoppingCart size={14} />}
                      >
                        Buy
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Box>
            ))
          ) : (
            <Box sx={{ 
              gridColumn: 'span 12',
              textAlign: 'center', 
              p: 4
            }}>
              <FileText size={48} style={{ color: 'gray', marginBottom: 16 }} />
              <Typography variant="h6">No listings match your criteria</Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search query
              </Typography>
              {showFilters && (
                <Button 
                  variant="text" 
                  onClick={resetFilters}
                  sx={{ mt: 2 }}
                >
                  Reset Filters
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default IntelMarketplacePanel;
