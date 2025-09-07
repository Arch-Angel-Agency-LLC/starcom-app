import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Divider, IconButton, List, ListItemButton, ListItemText, Stack, TextField, Typography, Tooltip, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import LaunchIcon from '@mui/icons-material/Launch';
import { useFilter, FilterState } from '../state/FilterContext';
import { reviveFilterState } from '../utils/deepLink';
import { useSelection } from '../state/SelectionContext';
import { useBoards } from '../state/BoardsContext';
import type { BoardState } from '../state/BoardsTypes';
import ExportDraftButton from './components/ExportDraftButton';

function reviveFilters(filters: FilterState): FilterState {
  return reviveFilterState(filters);
}

interface BoardsPanelProps {
  currentView: 'timeline' | 'map' | 'graph' | 'table';
  setCurrentView: (v: 'timeline' | 'map' | 'graph' | 'table') => void;
  activeBoardId: string | null;
  onActiveBoardChange: (id: string | null) => void;
}

const BoardsPanel: React.FC<BoardsPanelProps> = ({ currentView, setCurrentView, activeBoardId, onActiveBoardChange }) => {
  const { filters, setFilters } = useFilter();
  const { selectedItem, setSelectedItem } = useSelection();
  const { boards, activeBoardId: ctxActiveId, setActiveBoardId: setCtxActiveId, createBoard, deleteBoard } = useBoards();

  const [name, setName] = useState('');
  const activeId = activeBoardId ?? ctxActiveId;

  const activeBoard = useMemo(() => boards.find(b => b.id === activeId) || null, [boards, activeId]);

  const applyBoard = useCallback((board: BoardState) => {
    const revived = reviveFilters(board.state.filters);
    setFilters(revived);
    setCurrentView(board.state.view);
    if (board.state.selection) {
      setSelectedItem({ id: board.state.selection.id, type: board.state.selection.type, data: null });
    } else {
      setSelectedItem(null);
    }
  }, [setFilters, setSelectedItem, setCurrentView]);

  // If an active board id is provided (e.g., via deep link), apply it once boards are loaded
  useEffect(() => {
    if (activeBoard) {
      applyBoard(activeBoard);
    }
    // only run when id or boards list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, boards]);

  const handleSave = () => {
    if (!name.trim()) return;
    const newBoard: BoardState = createBoard({
      name: name.trim(),
      state: {
        view: currentView,
        filters,
        selection: selectedItem ? { id: selectedItem.id, type: selectedItem.type } : null,
        layout: { leftRailWidth: 300 }
      }
    } as Omit<BoardState, 'id' | 'savedAt'>);
    setName('');
    onActiveBoardChange(newBoard.id);
    setCtxActiveId(newBoard.id);
  };

  const handleDelete = (id: string) => {
    deleteBoard(id);
    if (activeId === id) {
      onActiveBoardChange(null);
      setCtxActiveId(null);
    }
  };

  const handleOpen = (id: string) => {
    const board = boards.find(b => b.id === id);
    if (!board) return;
    onActiveBoardChange(id);
    setCtxActiveId(id);
    applyBoard(board);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00ff41', mb: 1 }}>Boards</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          fullWidth
          placeholder="New board name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Tooltip title="Save current view, filters, and selection as a new board">
          <span>
            <IconButton aria-label="Save board" color="primary" onClick={handleSave} disabled={!name.trim()}>
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Divider sx={{ my: 1 }} />
      {/* Export current board to Draft (Phase D Step 12) */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <ExportDraftButton source="board" variant="outlined" size="small" children="Export Board to Draft" />
      </Stack>
      {boards.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>No boards saved yet.</Typography>
      ) : (
        <List dense>
          {boards.map(board => (
            <Stack key={board.id} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={activeBoardId === board.id}
                onClick={() => handleOpen(board.id)}
                sx={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ListItemText primary={board.name} secondary={new Date(board.savedAt).toLocaleString()} />
              </ListItemButton>
              <Tooltip title="Open board">
                <span>
                  <IconButton aria-label="Open board" onClick={() => handleOpen(board.id)} color={activeBoardId === board.id ? 'success' : 'default'}>
                    <LaunchIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Delete board">
                <span>
                  <IconButton aria-label="Delete board" onClick={() => handleDelete(board.id)}>
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ))}
        </List>
      )}
  {activeBoard && (
        <Box sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <Typography data-testid="active-board-label" variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Active: {activeBoard.name}
            </Typography>
            {(activeBoard.state.pins?.length ?? 0) > 0 && (
              <Chip size="small" color="success" label={`Pins: ${activeBoard.state.pins!.length}`} />
            )}
          </Stack>
          {typeof activeBoard.state.notes === 'string' && activeBoard.state.notes.length > 0 && (
            <Typography variant="body2" sx={{ color:'rgba(255,255,255,0.7)' }}>
              {activeBoard.state.notes}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default BoardsPanel;
