import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  TextField,
  Button,
  Stack,
  Divider,
  Slider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useCorrelation } from '../state/CorrelationContext';
import { useFilter } from '../state/FilterContext';
import { useBoards } from '../state/BoardsContext';

/**
 * FilterPanel - Left rail component for filters
 *
 * Provides UI for setting filters with chips display
 */

const FilterPanel: React.FC = () => {
  const { filters, updateFilter, clearFilters } = useFilter();
  const { showClusters, setShowClusters } = useCorrelation();
  const { boards, activeBoardId, addWatchTag, removeWatchTag, addWatchEntity, removeWatchEntity } = useBoards();
  const activeBoard = React.useMemo(() => boards.find(b => b.id === activeBoardId) || null, [boards, activeBoardId]);

  // Local state for time range inputs (HTML datetime-local expects YYYY-MM-DDTHH:mm)
  const [startInput, setStartInput] = useState<string>('');
  const [endInput, setEndInput] = useState<string>('');
  // Local state for confidence slider (0-100)
  const [confRange, setConfRange] = useState<[number, number]>([0, 100]);

  // Sync local inputs when external timeRange changes (e.g., from Timeline brush)
  useEffect(() => {
    if (filters.timeRange) {
      const toLocalInput = (d: Date) => {
        // Convert to local ISO without seconds for datetime-local
        const pad = (n: number) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const min = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
      };
      setStartInput(toLocalInput(filters.timeRange.start));
      setEndInput(toLocalInput(filters.timeRange.end));
    } else {
      setStartInput('');
      setEndInput('');
    }
  }, [filters.timeRange]);

  // Sync local confidence when external filter changes
  useEffect(() => {
    if (filters.confidence) {
      setConfRange([
        Math.round((filters.confidence.min ?? 0) * 100),
        Math.round((filters.confidence.max ?? 1) * 100)
      ]);
    } else {
      setConfRange([0, 100]);
    }
  }, [filters.confidence]);

  const parseLocal = (val?: string) => {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const startDate = parseLocal(startInput);
  const endDate = parseLocal(endInput);
  const timeValid = !!(startDate && endDate && startDate.getTime() <= endDate.getTime());

  const applyTimeRange = () => {
    if (timeValid && startDate && endDate) {
      updateFilter('timeRange', { start: startDate, end: endDate });
    }
  };

  const clearTimeRange = () => {
    updateFilter('timeRange', undefined);
    setStartInput('');
    setEndInput('');
  };

  const setPreset = (hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    // Update inputs and filter
    const toLocalInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };
    setStartInput(toLocalInput(start));
    setEndInput(toLocalInput(end));
    updateFilter('timeRange', { start, end });
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim()) {
      const currentTags = filters.tags || [];
      if (!currentTags.includes(tag.trim())) {
        updateFilter('tags', [...currentTags, tag.trim()]);
      }
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    const currentTags = filters.tags || [];
    updateFilter('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleCategoryAdd = (category: string) => {
    if (category.trim()) {
      const currentCategories = filters.categories || [];
      if (!currentCategories.includes(category.trim())) {
        updateFilter('categories', [...currentCategories, category.trim()]);
      }
    }
  };

  const handleCategoryRemove = (categoryToRemove: string) => {
    const currentCategories = filters.categories || [];
    updateFilter('categories', currentCategories.filter(cat => cat !== categoryToRemove));
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ color: '#00ff41', mb: 2 }}>
        Filters
      </Typography>

      {/* Time Range Controls */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>
          Time Range
        </Typography>
        <Stack direction="column" spacing={1} sx={{ mb: 1 }}>
          <TextField
            label="Start"
            type="datetime-local"
            size="small"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': { borderColor: 'rgba(0, 191, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(0, 191, 255, 0.6)' },
                '&.Mui-focused fieldset': { borderColor: '#00bfff' },
              },
              '& .MuiInputBase-input': { color: 'white' },
            }}
          />
          <TextField
            label="End"
            type="datetime-local"
            size="small"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': { borderColor: 'rgba(0, 191, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(0, 191, 255, 0.6)' },
                '&.Mui-focused fieldset': { borderColor: '#00bfff' },
              },
              '& .MuiInputBase-input': { color: 'white' },
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              data-testid="apply-time-range"
              onClick={applyTimeRange}
              disabled={!timeValid}
            >
              Apply
            </Button>
            <Button variant="outlined" size="small" onClick={() => setPreset(24)}>
              Last 24h
            </Button>
            <Button variant="outlined" size="small" onClick={() => setPreset(24 * 7)}>
              Last 7d
            </Button>
            <Button variant="text" size="small" color="error" onClick={clearTimeRange}>
              Clear
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Time Range Display */}
      {filters.timeRange && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>
            Time Range
          </Typography>
          <Chip
            label={`${filters.timeRange.start.toLocaleDateString()} - ${filters.timeRange.end.toLocaleDateString()}`}
            onDelete={() => updateFilter('timeRange', undefined)}
            sx={{
              backgroundColor: 'rgba(0, 191, 255, 0.2)',
              color: '#00bfff',
              border: '1px solid rgba(0, 191, 255, 0.3)',
              mb: 1
            }}
          />
        </Box>
      )}

      {/* Categories */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>
          Categories
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          {(filters.categories || []).map((category, index) => (
            <Chip
              key={index}
              label={category}
              onDelete={() => handleCategoryRemove(category)}
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 255, 65, 0.2)',
                color: '#00ff41',
                border: '1px solid rgba(0, 255, 65, 0.3)'
              }}
            />
          ))}
        </Stack>
        <TextField
          size="small"
          placeholder="Add category..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCategoryAdd((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '& fieldset': {
                borderColor: 'rgba(0, 255, 65, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 255, 65, 0.6)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00ff41',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
          }}
        />
      </Box>

      <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      {/* Watchlists */}
      <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>Watchlist</Typography>
      {/* Tags */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
        {(activeBoard?.state.watch?.tags ?? []).map((tag) => (
          <Chip key={`wt-${tag}`} label={`#${tag}`} size="small" onDelete={() => removeWatchTag(tag)} sx={{ backgroundColor:'rgba(255,170,0,0.2)', color:'#ffaa00', border:'1px solid rgba(255,170,0,0.3)'}} />
        ))}
      </Stack>
      <TextField
        size="small"
        placeholder="Add tag to watch…"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            const v = (e.target as HTMLInputElement).value.trim();
            if (v) addWatchTag(v);
            (e.target as HTMLInputElement).value = '';
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': { borderColor: 'rgba(255, 170, 0, 0.3)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 170, 0, 0.6)' },
            '&.Mui-focused fieldset': { borderColor: '#ffaa00' },
          },
          '& .MuiInputBase-input': { color: 'white' },
        }}
      />
      {/* Entities */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2, mb: 1 }}>
        {(activeBoard?.state.watch?.entities ?? []).map((id) => (
          <Chip key={`we-${id}`} label={id} size="small" onDelete={() => removeWatchEntity(id)} sx={{ backgroundColor:'rgba(155,89,182,0.2)', color:'#9c27b0', border:'1px solid rgba(155,89,182,0.3)'}} />
        ))}
      </Stack>
      <TextField
        size="small"
        placeholder="Add entity id to watch…"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            const v = (e.target as HTMLInputElement).value.trim();
            if (v) addWatchEntity(v);
            (e.target as HTMLInputElement).value = '';
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': { borderColor: 'rgba(155, 89, 182, 0.3)' },
            '&:hover fieldset': { borderColor: 'rgba(155, 89, 182, 0.6)' },
            '&.Mui-focused fieldset': { borderColor: '#9c27b0' },
          },
          '& .MuiInputBase-input': { color: 'white' },
        }}
      />
      <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Geo Filter (placeholder) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>
          Geo (placeholder)
        </Typography>
        {filters.geo ? (
          <Chip
            label={"Polygon (placeholder)"}
            onDelete={() => updateFilter('geo', undefined)}
            sx={{
              backgroundColor: 'rgba(0, 191, 255, 0.2)',
              color: '#00bfff',
              border: '1px solid rgba(0, 191, 255, 0.3)',
              mb: 1
            }}
          />
        ) : (
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              updateFilter('geo', {
                // Simple triangle polygon placeholder (lng,lat)
                polygon: [
                  [-122.45, 37.76],
                  [-122.40, 37.80],
                  [-122.35, 37.74],
                  [-122.45, 37.76]
                ]
              })
            }
            sx={{
              color: '#00bfff',
              borderColor: 'rgba(0, 191, 255, 0.5)',
              '&:hover': { borderColor: '#00bfff', backgroundColor: 'rgba(0, 191, 255, 0.1)' }
            }}
          >
            Add placeholder geo area
          </Button>
        )}
      </Box>

      {/* Tags */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>
          Tags
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          {(filters.tags || []).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              onDelete={() => handleTagRemove(tag)}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 170, 0, 0.2)',
                color: '#ffaa00',
                border: '1px solid rgba(255, 170, 0, 0.3)'
              }}
            />
          ))}
        </Stack>
        <TextField
          size="small"
          placeholder="Add tag..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleTagAdd((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '& fieldset': {
                borderColor: 'rgba(255, 170, 0, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 170, 0, 0.6)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ffaa00',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
          }}
        />
      </Box>

      {/* Confidence Range */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>
          Confidence
        </Typography>
        <Slider
          value={confRange}
          min={0}
          max={100}
          onChange={(_, value) => {
            if (Array.isArray(value)) setConfRange([value[0], value[1]] as [number, number]);
          }}
          valueLabelDisplay="auto"
          getAriaValueText={(v) => `${v}%`}
          valueLabelFormat={(v) => `${v}%`}
          sx={{
            color: '#ff4444',
            '& .MuiSlider-thumb': { boxShadow: 'none' }
          }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => updateFilter('confidence', { min: confRange[0] / 100, max: confRange[1] / 100 })}
          >
            Apply
          </Button>
          <Button
            variant="text"
            color="error"
            size="small"
            onClick={() => updateFilter('confidence', undefined)}
          >
            Clear
          </Button>
          <Chip
            label={`${confRange[0]}% - ${confRange[1]}%`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 68, 68, 0.2)',
              color: '#ff4444',
              border: '1px solid rgba(255, 68, 68, 0.3)'
            }}
          />
        </Stack>
      </Box>

      {/* Clear Filters */}
      <Button
        variant="outlined"
        onClick={clearFilters}
        sx={{
          mt: 2,
          color: '#ff4444',
          borderColor: 'rgba(255, 68, 68, 0.5)',
          '&:hover': {
            borderColor: '#ff4444',
            backgroundColor: 'rgba(255, 68, 68, 0.1)'
          }
        }}
      >
        Clear All Filters
      </Button>

      <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      {/* Correlation Tools */}
      <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>
        Correlation
      </Typography>
      <FormControlLabel
        control={<Switch color="success" checked={showClusters} onChange={(_, v) => setShowClusters(v)} />}
        label="Show clusters"
      />
    </Box>
  );
};

export default FilterPanel;
