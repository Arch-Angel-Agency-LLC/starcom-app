import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography
} from '@mui/material';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Event } from '../../adapters/eventsAdapter';
import { useFilter } from '../../state/FilterContext';
import { useSelection } from '../../state/SelectionContext';
import { useCorrelation } from '../../state/CorrelationContext';
import { useBoards } from '../../state/BoardsContext';

/**
 * TableView - Virtualized table for displaying events
 *
 * Shows events in a tabular format with filtering and selection
 */

interface TableViewProps {
  events: Event[];
}

const TableView: React.FC<TableViewProps> = ({ events }) => {
  const { filters } = useFilter();
  const { selectedItem, setSelectedItem } = useSelection();
  const { showClusters, anomaliesByDay } = useCorrelation();
  const { boards, activeBoardId } = useBoards();
  const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || null, [boards, activeBoardId]);

  // Apply filters to events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Time filter
      if (filters.timeRange) {
        const eventTime = new Date(event.timestamp);
        if (eventTime < filters.timeRange.start || eventTime > filters.timeRange.end) {
          return false;
        }
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(event.category)) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => event.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Confidence filter
      if (filters.confidence) {
        if (!event.confidence ||
            event.confidence < filters.confidence.min ||
            event.confidence > filters.confidence.max) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters]);

  const handleRowClick = useCallback((event: Event) => {
    setSelectedItem({ id: event.id, type: 'event', data: event });
  }, [setSelectedItem]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatLocation = (event: Event) => {
    if (event.lat && event.lon) {
      return `${event.lat.toFixed(4)}, ${event.lon.toFixed(4)}`;
    }
    return '-';
  };

  const Row: React.FC<ListChildComponentProps> = useCallback(({ index, style }) => {
    const event = filteredEvents[index];
  const dayKey = new Date(event.timestamp).toISOString().slice(0, 10);
  const isAnomaly = showClusters && anomaliesByDay.has(dayKey);
    const watch = activeBoard?.state.watch;
    const hasWatchTag = !!watch?.tags?.some(t => event.tags.includes(t));
    const hasWatchEntity = !!watch?.entities?.some(id => event.entityRefs?.includes(id));
    const isWatchHit = hasWatchTag || hasWatchEntity;
    return (
      <TableRow
        key={event.id}
        onClick={() => handleRowClick(event)}
        style={style}
        data-watch-hit={isWatchHit ? 'true' : undefined}
        sx={{
          cursor: 'pointer',
          backgroundColor:
            selectedItem?.id === event.id
              ? 'rgba(0, 255, 65, 0.1)'
              : isWatchHit
                ? 'rgba(255, 170, 0, 0.06)'
                : 'transparent',
          borderLeft: isWatchHit ? '3px solid rgba(255, 170, 0, 0.8)' : undefined,
          '&:hover': { backgroundColor: 'rgba(0, 255, 65, 0.05)' }
        }}
      >
        <TableCell sx={{ color: 'white' }}>{event.sourceType === 'REPORT' ? '📋' : '📄'}</TableCell>
        <TableCell sx={{ color: 'white' }}>{event.title}</TableCell>
        <TableCell sx={{ color: 'white' }}>
          {formatTimestamp(event.timestamp)}
          {isAnomaly && (
            <Chip
              size="small"
              color="warning"
              label="Anomaly"
              sx={{ ml: 1 }}
            />
          )}
          {isWatchHit && (
            <Chip
              size="small"
              color="primary"
              label="Watch"
              sx={{ ml: 1 }}
            />
          )}
        </TableCell>
        <TableCell sx={{ color: 'white' }}>{event.category}</TableCell>
        <TableCell>
          {event.tags.slice(0, 3).map((tag, i) => (
            <Chip
              key={i}
              label={tag}
              size="small"
              sx={{
                mr: 0.5,
                mb: 0.5,
                backgroundColor: 'rgba(0, 191, 255, 0.2)',
                color: '#00bfff',
                border: '1px solid rgba(0, 191, 255, 0.3)'
              }}
            />
          ))}
          {event.tags.length > 3 && (
            <Chip
              label={`+${event.tags.length - 3}`}
              size="small"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
            />
          )}
        </TableCell>
        <TableCell sx={{ color: 'white' }}>
          {event.confidence ? `${(event.confidence * 100).toFixed(0)}%` : '-'}
        </TableCell>
        <TableCell sx={{ color: 'white' }}>{formatLocation(event)}</TableCell>
      </TableRow>
    );
  }, [filteredEvents, handleRowClick, selectedItem, showClusters, anomaliesByDay, activeBoard?.state.watch]);

  // Dynamic height management for virtualization list
  const [listHeight, setListHeight] = useState<number>(400);
  const virtualContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!virtualContainerRef.current) return;
    const el = virtualContainerRef.current;
    const update = () => {
      // Use clientHeight; fallback to 400 if zero
      const h = el.clientHeight;
      if (h && h !== listHeight) {
        setListHeight(h);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [listHeight]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
        <Typography variant="h6" sx={{ color: '#00ff41' }}>
          Events Table ({filteredEvents.length} of {events.length})
        </Typography>
        {showClusters && (
          <Chip size="small" color="warning" label={`Anomaly days: ${anomaliesByDay.size}`} />
        )}
        {/* Watchlist hits count */}
        {(() => {
          const watch = activeBoard?.state.watch;
          if (!watch) return null;
          const hits = filteredEvents.reduce((acc, ev) => acc + ((watch.tags?.some(t => ev.tags.includes(t)) || watch.entities?.some(id => ev.entityRefs?.includes(id))) ? 1 : 0), 0);
          return hits > 0 ? (
            <Chip size="small" color="primary" label={`Watch hits: ${hits}`} data-testid="watch-hits-count" />
          ) : null;
        })()}
      </Box>
      <TableContainer component={Paper} sx={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(0, 255, 65, 0.2)'
      }}>
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#00ff41', fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: '#00ff41', fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ color: '#00ff41', fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ color: '#00ff41', fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ color: '#00ff41', fontWeight: 'bold' }}>Tags</TableCell>
              <TableCell sx={{ color: '#00ff41', fontWeight: 'bold' }}>Confidence</TableCell>
              <TableCell sx={{ color: '#00ff41', fontWeight: 'bold' }}>Location</TableCell>
            </TableRow>
          </TableHead>
        </Table>
  <Box ref={virtualContainerRef} sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableBody>
              <FixedSizeList
                height={listHeight}
                itemCount={filteredEvents.length}
                itemSize={56}
                width="100%"
                overscanCount={Math.max(5, Math.floor(listHeight / 56))}
              >
                {Row}
              </FixedSizeList>
            </TableBody>
          </Table>
        </Box>
      </TableContainer>
      <Typography variant="caption" sx={{ mt: 1, color: 'rgba(255,255,255,0.5)' }}>
  Virtualization: react-window with dynamic height & overscan (tune itemSize / perf later)
      </Typography>
    </Box>
  );
};

export default TableView;
