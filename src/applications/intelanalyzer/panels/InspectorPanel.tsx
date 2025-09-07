import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, Stack, IconButton, Tooltip, TextField, Button } from '@mui/material';
import { PushPin, Link, Launch, LocationOn, AccessTime } from '@mui/icons-material';
import { useSelection } from '../state/SelectionContext';
import { useFilter } from '../state/FilterContext';
import { Event } from '../adapters/eventsAdapter';
import { IntelReportUI } from '../../../types/intel/IntelReportUI';
import { IntelItemUI } from '../../../types/intel/IntelItemUI';
import { encodeDeepLink } from '../utils/deepLink';
import EventDetails from './components/EventDetails';
import { useCorrelation } from '../state/CorrelationContext';
import AnomalyBadge from './components/AnomalyBadge';
import { useBoards } from '../state/BoardsContext';
import ExportDraftButton from './components/ExportDraftButton';

/**
 * InspectorPanel - Right panel showing details of selected item
 *
 * Displays metadata, content, and actions for selected events
 */

const InspectorPanel: React.FC = () => {
  const { selectedItem } = useSelection();
  const { updateFilter } = useFilter();
  const navigate = useNavigate();
  const { addPin, setNotes, boards, activeBoardId } = useBoards();
  const { anomaliesByDay, showClusters } = useCorrelation();
  const activeBoard = boards.find(b => b.id === activeBoardId) || null;
  const [noteDraft, setNoteDraft] = React.useState(activeBoard?.state.notes || '');

  const handleEntityClick = (entity: string) => {
    updateFilter('entityRefs', [entity]);
  };

  const handlePinToBoard = () => {
  if (!selectedItem) return;
  const data = (selectedItem as unknown as { data?: { title?: string } }).data;
  addPin({ id: selectedItem.id, type: selectedItem.type, title: data?.title });
  };

  const handleCopyDeepLink = () => {
    if (!selectedItem) return;
    const deepLink = encodeDeepLink({ view: 'table', selected: selectedItem.id });
    const full = `${window.location.origin}${window.location.pathname}?${deepLink}`;
    navigator.clipboard.writeText(full);
    console.log('Copied deep link:', full);
  };

  const handleOpenInDashboard = () => {
    if (!selectedItem) return;
    const params = new URLSearchParams();
    params.set('from', 'intelanalyzer');
    params.set('selected', selectedItem.id);
    // Optionally pass current view hint
    params.set('view', 'table');
    navigate(`/intel?${params.toString()}`);
  };

  const saveNotes = () => {
    setNotes(noteDraft || '');
  };

  if (!selectedItem) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Select an item to inspect
        </Typography>
      </Box>
    );
  }

  // Event specific block moved into component

  // Report details (minimal specialized)
  const renderReport = (report: IntelReportUI) => (
    <Stack spacing={2} sx={{ mt:1 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Report</Typography>
        <Typography variant="body2" sx={{ color:'white' }}>{report.title || selectedItem.id}</Typography>
      </Box>
      {Array.isArray(report.tags) && report.tags.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Tags</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {report.tags.map((t: string) => <Chip key={t} label={t} size="small" sx={{ backgroundColor:'rgba(255,170,0,0.2)', color:'#ffaa00' }} />)}
          </Stack>
        </Box>
      )}
      {(report.createdAt || report.updatedAt) && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1, display:'flex', alignItems:'center' }}>
            <AccessTime sx={{ mr:1, fontSize:'1rem' }} /> Timestamp
          </Typography>
          <Typography variant="body2" sx={{ color:'white' }}>
            Created: {report.createdAt?.toLocaleString?.() || new Date(report.createdAt).toLocaleString()}<br />
            Updated: {report.updatedAt?.toLocaleString?.() || new Date(report.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      )}
    </Stack>
  );

  // Intel Item details (minimal specialized)
  const renderIntelItem = (item: IntelItemUI) => (
    <Stack spacing={2} sx={{ mt:1 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Intel Item</Typography>
        <Typography variant="body2" sx={{ color:'white' }}>{item.title || selectedItem.id}</Typography>
      </Box>
      {Array.isArray(item.tags) && item.tags.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Tags</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {item.tags.map((t: string) => <Chip key={t} label={t} size="small" sx={{ backgroundColor:'rgba(255,170,0,0.2)', color:'#ffaa00' }} />)}
          </Stack>
        </Box>
      )}
      {Array.isArray(item.categories) && item.categories.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Categories</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {item.categories.map((c: string) => (
              <Chip key={c} label={c} size="small" sx={{ backgroundColor:'rgba(0,255,65,0.2)', color:'#00ff41' }} />
            ))}
          </Stack>
        </Box>
      )}
      {(item.createdAt || item.updatedAt) && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1, display:'flex', alignItems:'center' }}>
            <AccessTime sx={{ mr:1, fontSize:'1rem' }} /> Timestamp
          </Typography>
          <Typography variant="body2" sx={{ color:'white' }}>
            Created: {item.createdAt?.toLocaleString?.() || new Date(item.createdAt).toLocaleString()}<br />
            Updated: {item.updatedAt?.toLocaleString?.() || new Date(item.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      )}
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Source & Classification</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={item.source} size="small" sx={{ backgroundColor:'rgba(0,191,255,0.2)', color:'#00bfff' }} />
          <Chip label={item.classification} size="small" sx={{ backgroundColor:'rgba(255,255,255,0.1)', color:'white' }} />
          <Chip label={`Reliability ${item.reliability}`} size="small" sx={{ backgroundColor:'rgba(255,255,255,0.1)', color:'white' }} />
          <Chip label={`Confidence ${(item.confidence*100).toFixed(0)}%`} size="small" sx={{ backgroundColor:'rgba(255,255,255,0.1)', color:'white' }} />
        </Stack>
      </Box>
      {(item.latitude !== undefined && item.longitude !== undefined) && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1, display:'flex', alignItems:'center' }}>
            <LocationOn sx={{ mr:1, fontSize:'1rem' }} /> Location
          </Typography>
          <Typography variant="body2" sx={{ color:'white' }}>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Typography>
        </Box>
      )}
    </Stack>
  );

  // Entity details (minimal specialized)
  type EntityUI = { id: string; name?: string; types?: string[]; tags?: string[] };
  const renderEntity = (entity: EntityUI) => (
    <Stack spacing={2} sx={{ mt:1 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Entity</Typography>
        <Typography variant="body2" sx={{ color:'white' }}>{entity.name || selectedItem.id}</Typography>
      </Box>
      {Array.isArray(entity.types) && entity.types.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Types</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {entity.types.map((t: string) => <Chip key={t} label={t} size="small" sx={{ backgroundColor:'rgba(0,255,65,0.2)', color:'#00ff41' }} />)}
          </Stack>
        </Box>
      )}
      {Array.isArray(entity.tags) && entity.tags.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Tags</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {entity.tags.map((t: string) => <Chip key={t} label={t} size="small" sx={{ backgroundColor:'rgba(255,170,0,0.2)', color:'#ffaa00' }} />)}
          </Stack>
        </Box>
      )}
    </Stack>
  );

  // Generic fallback renderer for other types
  const _renderGeneric = (typeLabel: string) => (
    <Stack spacing={2} sx={{ mt:1 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Type</Typography>
        <Chip label={typeLabel} size="small" sx={{ backgroundColor:'rgba(0,255,65,0.2)', color:'#00ff41' }} />
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>ID</Typography>
        <Typography variant="body2" sx={{ color:'white' }}>{selectedItem.id}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Raw Data (dev)</Typography>
        <Box sx={{ backgroundColor:'rgba(0,0,0,0.4)', p:1, borderRadius:1, fontFamily:'monospace', fontSize:'0.7rem', maxHeight:180, overflow:'auto', color:'white' }}>
          <pre style={{ margin:0 }}>{JSON.stringify(selectedItem.data, null, 2)}</pre>
        </Box>
      </Box>
    </Stack>
  );

  const content = () => {
    if (selectedItem.type === 'event') {
      return (
        <EventDetails
          event={selectedItem.data as Event}
          onEntityClick={handleEntityClick}
        />
      );
    }
    if (selectedItem.type === 'report') return renderReport(selectedItem.data as IntelReportUI);
    if (selectedItem.type === 'intelItem') return renderIntelItem(selectedItem.data as IntelItemUI);
    if (selectedItem.type === 'entity') return renderEntity(selectedItem.data as { id: string; name?: string; types?: string[]; tags?: string[] });
    return null;
  };

  return (
    <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <Box sx={{ p:2, borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Typography variant="h6" sx={{ color:'#00ff41' }}>Inspector</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Pin to Board"><IconButton aria-label="Pin to Board" size="small" onClick={handlePinToBoard} sx={{ color:'#ffaa00' }}><PushPin fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Copy Deep Link"><IconButton aria-label="Copy Deep Link" size="small" onClick={handleCopyDeepLink} sx={{ color:'#00bfff' }}><Link fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Open in Dashboard"><IconButton aria-label="Open in Dashboard" size="small" onClick={handleOpenInDashboard} sx={{ color:'#9c27b0' }}><Launch fontSize="small" /></IconButton></Tooltip>
            {/* Export to Draft (Phase D Step 12) */}
            <ExportDraftButton source="inspector" variant="outlined" size="small">Export</ExportDraftButton>
          </Stack>
        </Box>
      </Box>
      <Box sx={{ flex:1, overflowY:'auto', p:2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb:1 }}>
          <Typography variant="h6" sx={{ color:'#00ff41' }}>
            {selectedItem.type === 'event'
              ? ((selectedItem.data as Event | null | undefined)?.title ?? selectedItem.id)
              : ((selectedItem as { data?: { title?: string } }).data?.title ?? selectedItem.id)
            }
          </Typography>
          {/* Anomaly badge (Phase C Step 10) */}
          {selectedItem.type === 'event' && (
            <AnomalyBadge
              timestamp={(selectedItem.data as Event)?.timestamp}
              anomaliesByDay={anomaliesByDay}
              showClusters={showClusters}
            />
          )}
          {/* Watch badge when current event hits a watchlist */}
          {selectedItem.type === 'event' && (() => {
            const watch = activeBoard?.state.watch;
            const ev = selectedItem.data as Event;
            const hit = !!watch && ((watch.tags?.some(t => ev.tags.includes(t))) || (watch.entities?.some(id => ev.entityRefs?.includes(id))));
            return hit ? <Chip size="small" color="primary" label="Watch" /> : null;
          })()}
        </Stack>
        {content()}
        {/* Notes & Pins */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color:'#00bfff', mb:1 }}>Notes</Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder="Add notes or hypotheses…"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
          />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Button size="small" variant="outlined" onClick={saveNotes}>Save Notes</Button>
            {activeBoard?.state.pins && activeBoard.state.pins.length > 0 && (
              <Chip size="small" color="success" label={`Pinned: ${activeBoard.state.pins.length}`} />
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default InspectorPanel;
