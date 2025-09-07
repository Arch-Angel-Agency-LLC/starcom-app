import React from 'react';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { AccessTime, Category, Label, LocationOn } from '@mui/icons-material';
import { Event } from '../../adapters/eventsAdapter';
import { useBoards } from '../../state/BoardsContext';

export interface EventDetailsProps {
  event: Event;
  onEntityClick?: (entityId: string) => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, onEntityClick }) => {
  const { addWatchTag, addWatchEntity } = useBoards();
  const handleEntityClick = (id: string) => onEntityClick?.(id);

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ color: '#00bfff', mb: 1 }}>Source</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={event.sourceType} size="small" sx={{ backgroundColor:'rgba(0,191,255,0.2)', color:'#00bfff' }} />
          <Chip label={`ID: ${event.sourceId}`} size="small" sx={{ backgroundColor:'rgba(255,255,255,0.1)', color:'white' }} />
        </Stack>
      </Box>
      <Divider sx={{ borderColor:'rgba(255,255,255,0.1)' }} />
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1, display:'flex', alignItems:'center' }}>
          <AccessTime sx={{ mr:1, fontSize:'1rem' }} /> Timestamp
        </Typography>
        <Typography variant="body2" sx={{ color:'white' }}>{new Date(event.timestamp).toLocaleString()}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1, display:'flex', alignItems:'center' }}>
          <Category sx={{ mr:1, fontSize:'1rem' }} /> Category
        </Typography>
        <Chip label={event.category} size="small" sx={{ backgroundColor:'rgba(0,255,65,0.2)', color:'#00ff41' }} />
      </Box>
      {event.tags.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1, display:'flex', alignItems:'center' }}>
            <Label sx={{ mr:1, fontSize:'1rem' }} /> Tags
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {event.tags.map(t => (
              <Chip
                key={t}
                label={t}
                size="small"
                onDoubleClick={() => addWatchTag(t)}
                sx={{ backgroundColor:'rgba(255,170,0,0.2)', color:'#ffaa00', cursor:'pointer' }}
              />
            ))}
          </Stack>
        </Box>
      )}
      {(event.lat || event.lon) && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1, display:'flex', alignItems:'center' }}>
            <LocationOn sx={{ mr:1, fontSize:'1rem' }} /> Location
          </Typography>
          <Typography variant="body2" sx={{ color:'white' }}>{event.lat?.toFixed(4)}, {event.lon?.toFixed(4)}</Typography>
        </Box>
      )}
      {event.confidence !== undefined && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Confidence</Typography>
          <Typography variant="body2" sx={{ color:'white' }}>{(event.confidence * 100).toFixed(0)}%</Typography>
        </Box>
      )}
      {event.entityRefs.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Entities</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {event.entityRefs.map(e => (
              <Chip
                key={e}
                label={e}
                size="small"
                onClick={() => handleEntityClick(e)}
                onDoubleClick={() => addWatchEntity(e)}
                sx={{ backgroundColor:'rgba(155,89,182,0.2)', color:'#9c27b0', cursor:'pointer' }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default EventDetails;
