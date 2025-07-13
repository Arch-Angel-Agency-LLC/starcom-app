/**
 * Intel Search Component
 * 
 * Advanced search and filtering for Intel records
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Typography,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

import { Intel, IntelSource, ClassificationLevel, ReliabilityRating } from '../../models/intelligence/Intel';

interface IntelSearchProps {
  intel: Intel[];
  onFilteredResults: (filteredIntel: Intel[]) => void;
}

interface SearchFilters {
  searchTerm: string;
  sources: IntelSource[];
  classifications: ClassificationLevel[];
  reliabilityRange: ReliabilityRating[];
  dateRange: { start: number; end: number };
  verifiedOnly: boolean;
  hasLocation: boolean;
  tags: string[];
}

const reliabilityOrder: ReliabilityRating[] = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
const classificationOrder: ClassificationLevel[] = ['UNCLASS', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
const allSources: IntelSource[] = ['SIGINT', 'HUMINT', 'GEOINT', 'OSINT', 'COMINT', 'ELINT', 'MASINT', 'TECHINT'];

export const IntelSearch: React.FC<IntelSearchProps> = ({ intel, onFilteredResults }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    sources: [],
    classifications: [],
    reliabilityRange: [],
    dateRange: {
      start: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: Date.now()
    },
    verifiedOnly: false,
    hasLocation: false,
    tags: []
  });

  // Get all unique tags from intel records
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    intel.forEach(record => {
      record.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [intel]);

  // Filter intel based on current filters
  const filteredIntel = useMemo(() => {
    let filtered = intel;

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.id.toLowerCase().includes(term) ||
        record.location?.toLowerCase().includes(term) ||
        record.collectedBy.toLowerCase().includes(term) ||
        record.tags.some(tag => tag.toLowerCase().includes(term)) ||
        JSON.stringify(record.data).toLowerCase().includes(term)
      );
    }

    // Source filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter(record => filters.sources.includes(record.source));
    }

    // Classification filter
    if (filters.classifications.length > 0) {
      filtered = filtered.filter(record => filters.classifications.includes(record.classification));
    }

    // Reliability filter
    if (filters.reliabilityRange.length > 0) {
      filtered = filtered.filter(record => filters.reliabilityRange.includes(record.reliability));
    }

    // Date range filter
    filtered = filtered.filter(record => 
      record.timestamp >= filters.dateRange.start && 
      record.timestamp <= filters.dateRange.end
    );

    // Verified only filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(record => record.verified === true);
    }

    // Has location filter
    if (filters.hasLocation) {
      filtered = filtered.filter(record => record.latitude != null && record.longitude != null);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(record => 
        filters.tags.some(tag => record.tags.includes(tag))
      );
    }

    return filtered;
  }, [intel, filters]);

  // Update parent component when filtered results change
  React.useEffect(() => {
    onFilteredResults(filteredIntel);
  }, [filteredIntel, onFilteredResults]);

  // Update filter state
  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      sources: [],
      classifications: [],
      reliabilityRange: [],
      dateRange: {
        start: Date.now() - (30 * 24 * 60 * 60 * 1000),
        end: Date.now()
      },
      verifiedOnly: false,
      hasLocation: false,
      tags: []
    });
  };

  // Get filter summary
  const getFilterSummary = () => {
    const activeFilters = [];
    if (filters.searchTerm) activeFilters.push('search');
    if (filters.sources.length > 0) activeFilters.push('sources');
    if (filters.classifications.length > 0) activeFilters.push('classification');
    if (filters.reliabilityRange.length > 0) activeFilters.push('reliability');
    if (filters.verifiedOnly) activeFilters.push('verified');
    if (filters.hasLocation) activeFilters.push('location');
    if (filters.tags.length > 0) activeFilters.push('tags');
    
    return activeFilters.length > 0 ? `${activeFilters.length} active filters` : 'No filters applied';
  };

  return (
    <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#00ff00' }}>
            🔍 Intel Search & Filter
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#888' }}>
              {filteredIntel.length} of {intel.length} records • {getFilterSummary()}
            </Typography>
            <Button
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size="small"
              sx={{ color: '#ff4444' }}
            >
              Clear
            </Button>
          </Box>
        </Box>

        {/* Quick Search */}
        <TextField
          fullWidth
          placeholder="Search intel records..."
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
          sx={{ mb: 2 }}
          variant="outlined"
          size="small"
        />

        {/* Advanced Filters */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Sources */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sources</InputLabel>
                  <Select
                    multiple
                    value={filters.sources}
                    onChange={(e) => updateFilter('sources', e.target.value as IntelSource[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as IntelSource[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {allSources.map((source) => (
                      <MenuItem key={source} value={source}>{source}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Classifications */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Classifications</InputLabel>
                  <Select
                    multiple
                    value={filters.classifications}
                    onChange={(e) => updateFilter('classifications', e.target.value as ClassificationLevel[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as ClassificationLevel[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {classificationOrder.map((classification) => (
                      <MenuItem key={classification} value={classification}>{classification}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Reliability */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Reliability</InputLabel>
                  <Select
                    multiple
                    value={filters.reliabilityRange}
                    onChange={(e) => updateFilter('reliabilityRange', e.target.value as ReliabilityRating[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as ReliabilityRating[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {reliabilityOrder.map((reliability) => (
                      <MenuItem key={reliability} value={reliability}>
                        {reliability} - {
                          reliability === 'A' ? 'Completely reliable' :
                          reliability === 'B' ? 'Usually reliable' :
                          reliability === 'C' ? 'Fairly reliable' :
                          reliability === 'D' ? 'Not usually reliable' :
                          reliability === 'E' ? 'Unreliable' :
                          reliability === 'F' ? 'Reliability cannot be judged' :
                          'Deliberate deception suspected'
                        }
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tags */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tags</InputLabel>
                  <Select
                    multiple
                    value={filters.tags}
                    onChange={(e) => updateFilter('tags', e.target.value as string[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {availableTags.map((tag) => (
                      <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#ccc' }}>
                  Collection Date Range
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="datetime-local"
                      value={new Date(filters.dateRange.start).toISOString().slice(0, 16)}
                      onChange={(e) => updateFilter('dateRange', {
                        ...filters.dateRange,
                        start: new Date(e.target.value).getTime()
                      })}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="datetime-local"
                      value={new Date(filters.dateRange.end).toISOString().slice(0, 16)}
                      onChange={(e) => updateFilter('dateRange', {
                        ...filters.dateRange,
                        end: new Date(e.target.value).getTime()
                      })}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Switches */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.verifiedOnly}
                        onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
                      />
                    }
                    label="Verified Only"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.hasLocation}
                        onChange={(e) => updateFilter('hasLocation', e.target.checked)}
                      />
                    }
                    label="Has Geographic Data"
                  />
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};
