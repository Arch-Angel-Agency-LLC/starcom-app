/**
 * CreateListingForm.tsx
 * 
 * Component for creating new marketplace listings from intelligence reports.
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  FormHelperText,
  Divider,
  Alert,
  Stack,
  InputAdornment
} from '@mui/material';
import { 
  ShoppingCart, 
  Tag, 
  Calendar, 
  DollarSign,
  FileText,
  Upload
} from 'lucide-react';

import { IntelReport } from '../models/IntelReport';
import { PricingModel, IntelListingEntry } from '../marketplace/IntelligenceExchange';
import { createListing } from '../marketplace/ListingManager';
import { tokenizeIntelReport, TokenizedIntel } from '../marketplace/TokenizationService';

interface CreateListingFormProps {
  report: IntelReport;
  onListingCreated?: (listing: IntelListingEntry) => void;
  onCancel?: () => void;
}

/**
 * Form for creating a new marketplace listing from an intelligence report
 */
const CreateListingForm: React.FC<CreateListingFormProps> = ({
  report,
  onListingCreated,
  onCancel
}) => {
  // Form state
  const [price, setPrice] = useState<string>('');
  const [pricingModel, setPricingModel] = useState<PricingModel>('fixed');
  const [summary, setSummary] = useState<string>(report.summary);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [tags, setTags] = useState<string[]>(report.tags);
  const [categories, setCategories] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [tokenize, setTokenize] = useState<boolean>(true);
  const [blockchain, setBlockchain] = useState<'solana' | 'ethereum' | 'starcom-chain'>('starcom-chain');
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenizationError, setTokenizationError] = useState<string | null>(null);
  
  // Form validation
  const validateForm = (): boolean => {
    // Reset errors
    setError(null);
    
    // Price validation
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Please enter a valid price greater than zero.');
      return false;
    }
    
    // Summary validation
    if (!summary.trim()) {
      setError('Please provide a summary for the listing.');
      return false;
    }
    
    return true;
  };
  
  // Add a tag
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Add a category
  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };
  
  // Remove a category
  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setTokenizationError(null);
    
    try {
      // Create listing object
      const listing = createListing(report, {
        price: parseFloat(price),
        pricingModel,
        summary,
        previewContent,
        expiresAt: expiresAt || undefined,
        tags,
        categories
      });
      
      let tokenizedAsset: TokenizedIntel | null = null;
      
      // Tokenize the report if requested
      if (tokenize) {
        try {
          tokenizedAsset = await tokenizeIntelReport(report, {
            blockchain,
            metadata: {
              additionalAttributes: [
                {
                  trait_type: 'Listing Price',
                  value: parseFloat(price)
                },
                {
                  trait_type: 'Categories',
                  value: categories.join(', ')
                }
              ]
            }
          });
          
          // In a real implementation, we would link the listing and token here
          // linkListingToToken(listing, tokenizedAsset.tokenId);
          
        } catch (error) {
          console.error('Tokenization error:', error);
          setTokenizationError(`Failed to tokenize report: ${(error as Error).message}`);
          // Continue with listing creation even if tokenization fails
        }
      }
      
      // Call the callback with the created listing
      if (onListingCreated) {
        onListingCreated(listing);
      }
      
    } catch (error) {
      console.error('Error creating listing:', error);
      setError(`Failed to create listing: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <ShoppingCart size={20} style={{ marginRight: '8px' }} />
        Create Marketplace Listing
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        You are creating a listing for the intelligence report: <strong>{report.title}</strong>
      </Alert>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Price and Pricing Model */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DollarSign size={16} />
                  </InputAdornment>
                )
              }}
            />
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Pricing Model</InputLabel>
              <Select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value as PricingModel)}
                label="Pricing Model"
              >
                <MenuItem value="fixed">Fixed Price</MenuItem>
                <MenuItem value="auction">Auction</MenuItem>
                <MenuItem value="tiered">Tiered Access</MenuItem>
                <MenuItem value="subscription">Subscription</MenuItem>
              </Select>
              <FormHelperText>How the intel will be sold</FormHelperText>
            </FormControl>
          </Box>
          
          {/* Summary */}
          <TextField
            label="Listing Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            multiline
            rows={3}
            required
            fullWidth
            helperText="A brief description of the intelligence being offered"
          />
          
          {/* Preview Content */}
          <TextField
            label="Preview Content"
            value={previewContent}
            onChange={(e) => setPreviewContent(e.target.value)}
            multiline
            rows={3}
            fullWidth
            helperText="Optional preview content that potential buyers can see before purchase"
          />
          
          {/* Expiration Date */}
          <TextField
            label="Expiration Date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            fullWidth
            helperText="When the listing should expire (leave blank for no expiration)"
          />
          
          {/* Tags */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {tags.map(tag => (
                <Chip 
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
              {tags.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No tags added
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="New Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button 
                variant="outlined"
                onClick={handleAddTag}
                startIcon={<Tag size={16} />}
              >
                Add
              </Button>
            </Box>
          </Box>
          
          {/* Categories */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Categories</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {categories.map(category => (
                <Chip 
                  key={category}
                  label={category}
                  onDelete={() => handleRemoveCategory(category)}
                  size="small"
                />
              ))}
              {categories.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No categories added
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="New Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button 
                variant="outlined"
                onClick={handleAddCategory}
                startIcon={<Tag size={16} />}
              >
                Add
              </Button>
            </Box>
          </Box>
          
          <Divider />
          
          {/* Tokenization Options */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              <Upload size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
              Blockchain Tokenization
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FormControl component="fieldset">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    variant={tokenize ? "contained" : "outlined"}
                    color={tokenize ? "primary" : "inherit"}
                    onClick={() => setTokenize(true)}
                    sx={{ mr: 1 }}
                  >
                    Tokenize
                  </Button>
                  <Button 
                    variant={!tokenize ? "contained" : "outlined"}
                    color={!tokenize ? "primary" : "inherit"}
                    onClick={() => setTokenize(false)}
                  >
                    Skip Tokenization
                  </Button>
                </Box>
                <FormHelperText>
                  Tokenization allows your intel to be traded as a digital asset on the blockchain
                </FormHelperText>
              </FormControl>
            </Box>
            
            {tokenize && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Blockchain</InputLabel>
                <Select
                  value={blockchain}
                  onChange={(e) => setBlockchain(e.target.value as 'solana' | 'ethereum' | 'starcom-chain')}
                  label="Blockchain"
                >
                  <MenuItem value="starcom-chain">Starcom Chain</MenuItem>
                  <MenuItem value="solana">Solana</MenuItem>
                  <MenuItem value="ethereum">Ethereum</MenuItem>
                </Select>
                <FormHelperText>The blockchain network for your tokenized intel</FormHelperText>
              </FormControl>
            )}
            
            {tokenizationError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {tokenizationError}
              </Alert>
            )}
          </Box>
          
          <Divider />
          
          {/* Submit Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              startIcon={<ShoppingCart size={16} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
};

export default CreateListingForm;
