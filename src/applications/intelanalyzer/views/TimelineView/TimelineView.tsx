import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import TimeMapApplication from '../../../timemap/TimeMapApplication';
import { useFilter } from '../../state/FilterContext';
import { Event, adaptWorkspaceToEvents } from '../../adapters/eventsAdapter';
import { useIntelWorkspace } from '../../../../services/intel/IntelWorkspaceContext';

/**
 * TimelineView - Wraps TimeMapApplication for the Analysis Workbench
 *
 * Adapts workspace data to TimeMap format and handles filter integration
 */

interface TimelineViewProps {
  onTimeFilterChange?: (timeRange: { start: Date; end: Date } | null) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ onTimeFilterChange }) => {
  const { reports, intelItems } = useIntelWorkspace();
  const { filters } = useFilter();

  // Adapt workspace data to events
  const events = useMemo(() => {
    return adaptWorkspaceToEvents(reports, intelItems);
  }, [reports, intelItems]);

  // Convert events to TimeMap format
  const timeMapEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: `Source: ${event.sourceType} - ${event.sourceId}`,
      timestamp: event.timestamp,
      category: mapCategoryToTimeMap(event.category),
      severity: mapConfidenceToSeverity(event.confidence),
      source: event.sourceType,
      location: event.lat && event.lon ? {
        lat: event.lat,
        lng: event.lon,
        name: `${event.lat.toFixed(4)}, ${event.lon.toFixed(4)}`
      } : undefined,
      entities: event.entityRefs,
      tags: event.tags,
      relatedEvents: []
    }));
  }, [events]);

  // Handle time brushing from TimeMap
  const handleTimeFilterChange = (timeRange: { start: Date; end: Date } | null) => {
    if (onTimeFilterChange) {
      onTimeFilterChange(timeRange);
    }
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* For now, just render a placeholder. In a full implementation,
          we'd modify TimeMapApplication to accept events as props */}
      <Box sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(0, 255, 65, 0.2)'
      }}>
        <Box sx={{ textAlign: 'center', color: '#00ff41' }}>
          <h3>Timeline View</h3>
          <p>Events loaded: {timeMapEvents.length}</p>
          <p>Time filter: {filters.timeRange ? `${filters.timeRange.start} - ${filters.timeRange.end}` : 'None'}</p>
          <small>TimeMap integration pending - using placeholder</small>
        </Box>
      </Box>
    </Box>
  );
};

// Helper functions for mapping
const mapCategoryToTimeMap = (category: string): 'intelligence' | 'security' | 'operation' | 'communication' | 'analysis' => {
  const mapping: Record<string, 'intelligence' | 'security' | 'operation' | 'communication' | 'analysis'> = {
    'GENERAL': 'intelligence',
    'OSINT': 'intelligence',
    'HUMINT': 'intelligence',
    'SIGINT': 'communication',
    'GEOINT': 'operation',
    'TECHINT': 'analysis'
  };
  return mapping[category] || 'intelligence';
};

const mapConfidenceToSeverity = (confidence?: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (!confidence) return 'low';
  if (confidence >= 0.8) return 'critical';
  if (confidence >= 0.6) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
};

export default TimelineView;
