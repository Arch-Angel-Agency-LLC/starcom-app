import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useFilter } from '../../state/FilterContext';
import { useSelection } from '../../state/SelectionContext';
import { adaptWorkspaceToEvents } from '../../adapters/eventsAdapter';
import { useCorrelation } from '../../state/CorrelationContext';
import { useIntelWorkspace } from '../../../../services/intel/IntelWorkspaceContext';
import TimelineHistogram from './components/TimelineHistogram';
import TimeMapBands from './components/TimeMapBands';

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
  const { selectedItem, setSelectedItem } = useSelection();
  const { showClusters, anomaliesByDay } = useCorrelation();

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

  // Handle time brushing from TimeMap (memoized)
  const handleTimeFilterChange = useCallback((timeRange: { start: Date; end: Date } | null) => {
    if (onTimeFilterChange) {
      onTimeFilterChange(timeRange);
    }
  }, [onTimeFilterChange]);

  // Derive min/max timestamps for brush domain
  const [domain, setDomain] = useState<[number, number] | null>(null);
  const [range, setRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (timeMapEvents.length === 0) {
      setDomain(null);
      setRange(null);
      return;
    }
    const timestamps = timeMapEvents.map(e => new Date(e.timestamp).getTime()).sort((a, b) => a - b);
    const min = timestamps[0];
    const max = timestamps[timestamps.length - 1];
    setDomain([min, max]);

    // Sync with external filter if present, else default full range
    if (filters.timeRange) {
      setRange([filters.timeRange.start.getTime(), filters.timeRange.end.getTime()]);
    } else {
      setRange([min, max]);
    }
  }, [timeMapEvents, filters.timeRange]);

  // Commit brush changes upstream
  const commitRange = useCallback((value: number[]) => {
    if (value.length === 2) {
      const [startMs, endMs] = value;
      handleTimeFilterChange({ start: new Date(startMs), end: new Date(endMs) });
    }
  }, [handleTimeFilterChange]);

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ mb: 2, textAlign: 'center', color: '#00ff41' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Timeline View</Typography>
        <Typography variant="body2">Events loaded: {timeMapEvents.length}</Typography>
        <Typography variant="body2">Selected: {selectedItem ? selectedItem.id : 'None'}</Typography>
        <Typography variant="body2">Time filter: {filters.timeRange ? `${filters.timeRange.start.toLocaleString()} — ${filters.timeRange.end.toLocaleString()}` : 'None'}</Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#00bfff' }}>
          Histogram brush active — filters sync with selection.
        </Typography>
        {showClusters && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#ffaa00' }}>
            Correlation: {anomaliesByDay.size} anomalous day{anomaliesByDay.size === 1 ? '' : 's'} detected in range
          </Typography>
        )}
      </Box>
      {domain && range ? (
        <TimelineHistogram
          timestamps={timeMapEvents.map(e => new Date(e.timestamp).getTime())}
          domain={domain}
          range={range}
          onChange={(r) => setRange(r)}
          onCommit={(r) => commitRange(r)}
          onLast24h={() => {
            const end = domain[1];
            const start = end - 24 * 60 * 60 * 1000;
            const clampedStart = start < domain[0] ? domain[0] : start;
            const newRange: [number, number] = [clampedStart, end];
            setRange(newRange);
            commitRange(newRange);
          }}
          onClear={() => {
            setRange([domain[0], domain[1]]);
            handleTimeFilterChange(null);
          }}
        />
      ) : (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          No events available for brushing.
        </Typography>
      )}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {domain ? (
          <TimeMapBands
            events={timeMapEvents.map(e => ({ id: e.id, timestamp: e.timestamp, category: e.category, severity: e.severity }))}
            domain={domain}
            selectedId={selectedItem?.id || null}
            currentRange={range as [number, number]}
            onEventClick={(id) => {
              const ev = events.find(ev => ev.id === id);
              if (ev) {
                setSelectedItem({ id: ev.id, type: 'event', data: ev });
              }
            }}
            height={220}
            showAnomalyBands={showClusters}
            anomalyDays={anomaliesByDay}
          />
        ) : (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            No events to render.
          </Typography>
        )}
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
