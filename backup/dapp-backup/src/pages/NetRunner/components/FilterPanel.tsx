import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Checkbox, 
  FormControlLabel, 
  Divider, 
  Button, 
  FormGroup,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Switch,
  Chip,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import { 
  Filter, 
  X, 
  Calendar, 
  Globe, 
  Shield, 
  Info,
  CheckCircle
} from 'lucide-react';

import { SearchSource } from '../types/netrunner';

// Define props interface
interface FilterPanelProps {
  sources: SearchSource[];
  onSourcesChange: (sources: SearchSource[]) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * FilterPanel Component
 * 
 * Advanced filtering panel for the NetRunner Dashboard that allows users to
 * refine their search queries with multiple filtering options.
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  sources,
  onSourcesChange,
  timeRange,
  onTimeRangeChange,
  filters,
  onFiltersChange,
  onClose,
  isOpen
}) => {
  // Local state for filter modifications
  const [localFilters, setLocalFilters] = useState<Record<string, unknown>>({...filters});
  const [localSources, setLocalSources] = useState<SearchSource[]>([...sources]);
  const [localTimeRange, setLocalTimeRange] = useState<string>(timeRange);
  
  // Handle source toggle
  const handleSourceToggle = (sourceId: string) => {
    const updatedSources = localSources.map(source => 
      source.id === sourceId 
        ? { ...source, checked: !source.checked } 
        : source
    );
    setLocalSources(updatedSources);
  };
  
  // Handle filter change
  const handleFilterChange = (key: string, value: unknown) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    onSourcesChange(localSources);
    onTimeRangeChange(localTimeRange);
    onFiltersChange(localFilters);
    onClose();
  };
  
  // Reset filters
  const resetFilters = () => {
    // Reset to default values
    setLocalSources(sources.map(source => ({
      ...source,
      checked: source.id === 'web' || source.id === 'social' || source.id === 'news'
    })));
    setLocalTimeRange('all');
    setLocalFilters({});
  };
  
  // Determine if sources include premium options
  const hasPremiumSourcesSelected = localSources.some(s => s.premium && s.checked);
  
  return (
    <Collapse in={isOpen} timeout="auto">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 2,
          backgroundColor: '#0f1620',
          border: '1px solid #2a3f5a',
          borderRadius: '8px'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Filter size={20} style={{ marginRight: '8px' }} />
            Advanced Filters
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={18} />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Sources Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Data Sources</Typography>
          <FormGroup>
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {localSources.map(source => (
                <FormControlLabel
                  key={source.id}
                  control={
                    <Checkbox 
                      checked={source.checked} 
                      onChange={() => handleSourceToggle(source.id)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {source.label}
                      {source.premium && (
                        <Chip 
                          label="Premium" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1, height: '18px', fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  }
                  sx={{ width: '50%', my: 0.5 }}
                />
              ))}
            </Box>
          </FormGroup>
          
          {hasPremiumSourcesSelected && (
            <Box sx={{ 
              mt: 1, 
              p: 1, 
              borderRadius: '4px', 
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Info size={16} style={{ marginRight: '8px', color: '#64b5f6' }} />
              <Typography variant="caption">
                Premium sources require authentication or paid access.
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Time Range Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Calendar size={18} style={{ marginRight: '8px' }} />
            Time Range
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={localTimeRange}
              onChange={(e) => setLocalTimeRange(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: '#1a2635' }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="day">Past 24 Hours</MenuItem>
              <MenuItem value="week">Past Week</MenuItem>
              <MenuItem value="month">Past Month</MenuItem>
              <MenuItem value="year">Past Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>
          
          {localTimeRange === 'custom' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="From"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                value={localFilters.startDate || ''}
                sx={{ backgroundColor: '#1a2635' }}
              />
              <TextField
                label="To"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                value={localFilters.endDate || ''}
                sx={{ backgroundColor: '#1a2635' }}
              />
            </Box>
          )}
        </Box>
        
        {/* Content Type Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Content Type</Typography>
          <FormGroup row>
            {['Web Pages', 'Documents', 'Images', 'Videos', 'Code'].map(type => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox 
                    size="small"
                    checked={Boolean(localFilters[`contentType_${type}`])}
                    onChange={(e) => handleFilterChange(`contentType_${type}`, e.target.checked)}
                  />
                }
                label={type}
                sx={{ width: '33%' }}
              />
            ))}
          </FormGroup>
        </Box>
        
        {/* Location Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Globe size={18} style={{ marginRight: '8px' }} />
            Geographic Filter
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={localFilters.region || 'global'}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              displayEmpty
              sx={{ backgroundColor: '#1a2635' }}
            >
              <MenuItem value="global">Global (No Restriction)</MenuItem>
              <MenuItem value="us">United States</MenuItem>
              <MenuItem value="eu">European Union</MenuItem>
              <MenuItem value="asia">Asia</MenuItem>
              <MenuItem value="custom">Custom Region</MenuItem>
            </Select>
          </FormControl>
          
          {localFilters.region === 'custom' && (
            <TextField
              label="Country or Region"
              size="small"
              fullWidth
              onChange={(e) => handleFilterChange('customRegion', e.target.value)}
              value={localFilters.customRegion || ''}
              placeholder="e.g. Canada, Berlin, Southeast Asia"
              sx={{ backgroundColor: '#1a2635' }}
            />
          )}
        </Box>
        
        {/* OPSEC Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Shield size={18} style={{ marginRight: '8px' }} />
            OPSEC Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={Boolean(localFilters.anonymizeSearches)}
                onChange={(e) => handleFilterChange('anonymizeSearches', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">Anonymize Searches</Typography>
                <Tooltip title="Routes searches through proxy nodes to hide your identity">
                  <Info size={16} style={{ marginLeft: '8px', color: '#64b5f6' }} />
                </Tooltip>
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={Boolean(localFilters.safeMode)}
                onChange={(e) => handleFilterChange('safeMode', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">Safe Mode</Typography>
                <Tooltip title="Filters out potentially harmful or malicious content">
                  <Info size={16} style={{ marginLeft: '8px', color: '#64b5f6' }} />
                </Tooltip>
              </Box>
            }
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={resetFilters}
            startIcon={<X size={18} />}
          >
            Reset Filters
          </Button>
          
          <Box>
            <Button 
              variant="text" 
              onClick={onClose}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={applyFilters}
              startIcon={<CheckCircle size={18} />}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Paper>
    </Collapse>
  );
};

export default FilterPanel;
