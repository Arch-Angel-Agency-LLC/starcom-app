import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  CircularProgress,
  TextField,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider
} from '@mui/material';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward, 
  RefreshCw,
  Filter
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';

// Timeline event interface
interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: string;
  severity: number;
  source: string;
  entities: string[];
}

// Severity color mapping
const severityMap: Record<number, { color: string, label: string }> = {
  0.25: { color: '#41c7e4', label: 'low' },
  0.5: { color: '#e4c641', label: 'medium' },
  0.75: { color: '#e49a41', label: 'high' },
  1: { color: '#e44141', label: 'critical' }
};

// Get severity info based on confidence score
const getSeverityInfo = (confidence: number) => {
  const thresholds = Object.keys(severityMap).map(Number).sort();
  const threshold = thresholds.find(t => confidence <= t) || thresholds[thresholds.length - 1];
  return severityMap[threshold];
};

// Category icon mapping
const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'financial': return '💰';
    case 'social': return '🗣️';
    case 'communication': return '✉️';
    case 'digital': return '💻';
    case 'threat': return '⚠️';
    case 'defense': return '🛡️';
    case 'intelligence': return '🔍';
    case 'logistics': return '📦';
    case 'technology': return '🔧';
    case 'security': return '🔒';
    case 'diplomacy': return '🤝';
    default: return '📋';
  }
};

/**
 * Timeline Dashboard
 * 
 * A dashboard for chronological analysis of events and patterns over time.
 */
const TimelineDashboard: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<number>(0);
  const [sourceFilters, setSourceFilters] = useState<string[]>([]);
  
  // Load sample data for the timeline
  useEffect(() => {
    const loadSampleData = async () => {
      setLoading(true);
      
      try {
        // In a real implementation, this would load from an API or service
        // For now, we'll create some sample data
        const sampleEvents: TimelineEvent[] = [
          {
            id: '1',
            title: 'Email Communication Detected',
            description: 'Email exchange between Subject A and Organization B regarding project plans',
            timestamp: '2025-06-15T08:30:00Z',
            category: 'communication',
            severity: 0.25,
            source: 'email-intel',
            entities: ['Subject A', 'Organization B']
          },
          {
            id: '2',
            title: 'Financial Transaction',
            description: 'Transfer of $25,000 from Account X to Account Y',
            timestamp: '2025-06-18T14:22:00Z',
            category: 'financial',
            severity: 0.5,
            source: 'financial-records',
            entities: ['Account X', 'Account Y']
          },
          {
            id: '3',
            title: 'Social Media Post',
            description: 'Subject A posted about upcoming travel to restricted location',
            timestamp: '2025-06-20T19:15:00Z',
            category: 'social',
            severity: 0.5,
            source: 'social-media',
            entities: ['Subject A', 'Location C']
          },
          {
            id: '4',
            title: 'Login from Unusual Location',
            description: 'System access from unrecognized IP address in foreign country',
            timestamp: '2025-06-25T02:44:00Z',
            category: 'digital',
            severity: 0.75,
            source: 'system-logs',
            entities: ['Subject A', 'Device D']
          },
          {
            id: '5',
            title: 'Suspicious File Download',
            description: 'Download of encrypted file from known malicious source',
            timestamp: '2025-06-28T11:07:00Z',
            category: 'threat',
            severity: 1,
            source: 'network-monitor',
            entities: ['Subject A', 'File E']
          },
          {
            id: '6',
            title: 'In-Person Meeting',
            description: 'Subject A met with Person F at Location G',
            timestamp: '2025-07-01T16:30:00Z',
            category: 'intelligence',
            severity: 0.5,
            source: 'field-report',
            entities: ['Subject A', 'Person F', 'Location G']
          },
          {
            id: '7',
            title: 'Document Access',
            description: 'Subject A accessed classified document H',
            timestamp: '2025-07-03T09:22:00Z',
            category: 'security',
            severity: 0.5,
            source: 'document-system',
            entities: ['Subject A', 'Document H']
          }
        ];
        
        // Extract all categories and sources for filtering
        const uniqueCategories = [...new Set(sampleEvents.map(event => event.category))];
        const uniqueSources = [...new Set(sampleEvents.map(event => event.source))];
        
        setCategoryFilters(uniqueCategories);
        setSourceFilters(uniqueSources);
        
        setEvents(sampleEvents);
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSampleData();
  }, []);
  
  // Filter events based on date range, categories, and severity
  const filteredEvents = events.filter(event => {
    const eventDate = parseISO(event.timestamp);
    const inDateRange = eventDate >= startDate && eventDate <= endDate;
    const matchesCategory = categoryFilters.length === 0 || categoryFilters.includes(event.category);
    const matchesSeverity = event.severity >= severityFilter;
    const matchesSource = sourceFilters.length === 0 || sourceFilters.includes(event.source);
    
    return inDateRange && matchesCategory && matchesSeverity && matchesSource;
  }).sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  
  // Handle event selection
  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
  };
  
  // Handle play/pause toggle
  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Move forward in time
  const handleStepForward = () => {
    setEndDate(addDays(endDate, 1));
    setStartDate(addDays(startDate, 1));
  };
  
  // Move backward in time
  const handleStepBackward = () => {
    setEndDate(subDays(endDate, 1));
    setStartDate(subDays(startDate, 1));
  };
  
  // Reset to current date
  const handleReset = () => {
    setEndDate(new Date());
    setStartDate(subDays(new Date(), 30));
  };
  
  // Toggle category filter
  const toggleCategoryFilter = (category: string) => {
    if (categoryFilters.includes(category)) {
      setCategoryFilters(categoryFilters.filter(c => c !== category));
    } else {
      setCategoryFilters([...categoryFilters, category]);
    }
  };
  
  // Toggle source filter
  const toggleSourceFilter = (source: string) => {
    if (sourceFilters.includes(source)) {
      setSourceFilters(sourceFilters.filter(s => s !== source));
    } else {
      setSourceFilters([...sourceFilters, source]);
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Timeline Analysis
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshCw />}
          onClick={handleReset}
        >
          Reset Timeline
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ display: 'flex', mb: 3 }}>
        <Paper elevation={3} sx={{ p: 2, mr: 2, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Calendar size={20} style={{ marginRight: 8 }} />
            <Typography variant="subtitle1">
              {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button size="small" startIcon={<SkipBack />} onClick={() => {
              setStartDate(subDays(startDate, 30));
              setEndDate(subDays(endDate, 30));
            }}>
              -30 Days
            </Button>
            <Button size="small" startIcon={<ChevronLeft />} onClick={handleStepBackward}>
              Previous Day
            </Button>
            <Button 
              size="small" 
              startIcon={isPlaying ? <Pause /> : <Play />}
              onClick={handlePlayToggle}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button size="small" startIcon={<ChevronRight />} onClick={handleStepForward}>
              Next Day
            </Button>
            <Button size="small" startIcon={<SkipForward />} onClick={() => {
              setStartDate(addDays(startDate, 30));
              setEndDate(addDays(endDate, 30));
            }}>
              +30 Days
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Playback Speed
          </Typography>
          <Slider
            size="small"
            min={0.5}
            max={5}
            step={0.5}
            value={playbackSpeed}
            onChange={(_, value) => setPlaybackSpeed(value as number)}
            marks={[
              { value: 0.5, label: '0.5x' },
              { value: 1, label: '1x' },
              { value: 2, label: '2x' },
              { value: 5, label: '5x' }
            ]}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>
            Minimum Severity
          </Typography>
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.25}
            value={severityFilter}
            onChange={(_, value) => setSeverityFilter(value as number)}
            marks={[
              { value: 0, label: 'All' },
              { value: 0.25, label: 'Low' },
              { value: 0.5, label: 'Medium' },
              { value: 0.75, label: 'High' },
              { value: 1, label: 'Critical' }
            ]}
            sx={{ mb: 2 }}
          />
        </Paper>
        
        <Paper elevation={3} sx={{ p: 2, width: '300px' }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            Event Categories
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {[...new Set(events.map(event => event.category))].map(category => (
              <Chip
                key={category}
                label={`${getCategoryIcon(category)} ${category}`}
                size="small"
                onClick={() => toggleCategoryFilter(category)}
                sx={{ 
                  mb: 1,
                  bgcolor: categoryFilters.includes(category) ? 'primary.main' : 'transparent',
                  color: categoryFilters.includes(category) ? 'white' : 'inherit',
                  border: !categoryFilters.includes(category) ? '1px solid' : 'none'
                }}
              />
            ))}
          </Stack>
          
          <Typography variant="subtitle2" gutterBottom>
            Event Sources
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[...new Set(events.map(event => event.source))].map(source => (
              <Chip
                key={source}
                label={source}
                size="small"
                onClick={() => toggleSourceFilter(source)}
                sx={{ 
                  mb: 1,
                  bgcolor: sourceFilters.includes(source) ? 'secondary.main' : 'transparent',
                  color: sourceFilters.includes(source) ? 'white' : 'inherit',
                  border: !sourceFilters.includes(source) ? '1px solid' : 'none'
                }}
              />
            ))}
          </Stack>
        </Paper>
      </Box>
      
      <Paper elevation={3} sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : filteredEvents.length > 0 ? (
          <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ width: '70%', height: '100%', overflow: 'auto', borderRight: '1px solid rgba(0,0,0,0.12)', p: 2 }}>
              {filteredEvents.map((event, index) => {
                const severityInfo = getSeverityInfo(event.severity);
                const previousDate = index > 0 ? parseISO(filteredEvents[index - 1].timestamp) : null;
                const currentDate = parseISO(event.timestamp);
                const showDateDivider = !previousDate || 
                  previousDate.getDate() !== currentDate.getDate() || 
                  previousDate.getMonth() !== currentDate.getMonth() || 
                  previousDate.getFullYear() !== currentDate.getFullYear();
                
                return (
                  <React.Fragment key={event.id}>
                    {showDateDivider && (
                      <Box sx={{ 
                        backgroundColor: 'background.default', 
                        p: 1, 
                        borderRadius: 1, 
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <Calendar size={16} style={{ marginRight: 8 }} />
                        <Typography variant="subtitle2">
                          {format(currentDate, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                      </Box>
                    )}
                    <Box 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        border: '1px solid rgba(0,0,0,0.12)', 
                        borderLeft: `4px solid ${severityInfo.color}`,
                        borderRadius: 1,
                        cursor: 'pointer',
                        backgroundColor: selectedEvent?.id === event.id ? 'rgba(0,0,0,0.05)' : 'inherit'
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {getCategoryIcon(event.category)} {event.title}
                        </Typography>
                        <Chip 
                          label={severityInfo.label} 
                          size="small"
                          sx={{ 
                            backgroundColor: severityInfo.color,
                            color: 'white'
                          }} 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                        <Clock size={14} style={{ marginRight: 4 }} />
                        <Typography variant="body2">
                          {format(parseISO(event.timestamp), 'h:mm a')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {event.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {event.entities.map(entity => (
                          <Chip 
                            key={entity} 
                            label={entity} 
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </React.Fragment>
                );
              })}
            </Box>
            <Box sx={{ width: '30%', p: 2 }}>
              {selectedEvent ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Event Details
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {selectedEvent.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(parseISO(selectedEvent.timestamp), 'PPpp')}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1" paragraph>
                    {selectedEvent.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Category:</Typography>
                    <Chip 
                      label={`${getCategoryIcon(selectedEvent.category)} ${selectedEvent.category}`}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Severity:</Typography>
                    <Chip 
                      label={getSeverityInfo(selectedEvent.severity).label}
                      sx={{ 
                        mt: 0.5,
                        bgcolor: getSeverityInfo(selectedEvent.severity).color,
                        color: 'white'
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Source:</Typography>
                    <Chip label={selectedEvent.source} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Related Entities:</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      {selectedEvent.entities.map(entity => (
                        <Chip key={entity} label={entity} size="small" />
                      ))}
                    </Stack>
                  </Box>
                </>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <Filter size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                  <Typography variant="body1" align="center">
                    Select an event from the timeline to view details
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            p: 4
          }}>
            <Typography variant="h6">No events match the current filters</Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your date range or removing some filters
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<RefreshCw />} 
              sx={{ mt: 2 }}
              onClick={handleReset}
            >
              Reset Filters
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TimelineDashboard;
