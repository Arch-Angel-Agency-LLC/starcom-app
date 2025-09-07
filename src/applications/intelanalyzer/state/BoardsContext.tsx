/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { BoardState } from './BoardsTypes';
import type { SelectionItem } from './SelectionContext';

// Types now sourced from BoardsTypes


const STORAGE_KEY = 'intelAnalyzer.boards';

function loadBoards(): BoardState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const boards: BoardState[] = JSON.parse(raw);
    return boards;
  } catch {
    return [];
  }
}

function saveBoards(boards: BoardState[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

// Context provided by BoardsContextInternal

export const BoardsProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [boards, setBoards] = useState<BoardState[]>(() => loadBoards());
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  useEffect(() => { saveBoards(boards); }, [boards]);

  const createBoard: BoardsCtxVal['createBoard'] = React.useCallback((boardLike) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const newBoard: BoardState = { id, savedAt: Date.now(), ...boardLike } as BoardState;
    if (!newBoard.state.watch) newBoard.state.watch = { entities: [], tags: [] };
    setBoards(prev => [newBoard, ...prev]);
    setActiveBoardId(id);
    return newBoard;
  }, []);

  const deleteBoard: BoardsCtxVal['deleteBoard'] = React.useCallback((id) => {
    setBoards(prev => prev.filter(b => b.id !== id));
    if (activeBoardId === id) setActiveBoardId(null);
  }, [activeBoardId]);

  const updateActiveBoardState: BoardsCtxVal['updateActiveBoardState'] = React.useCallback((patch) => {
    if (!activeBoardId) return;
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, state: { ...b.state, ...patch } } : b));
  }, [activeBoardId]);

  const addPin: BoardsCtxVal['addPin'] = React.useCallback((pin) => {
    if (!activeBoardId) return;
    setBoards(prev => prev.map(b => {
      if (b.id !== activeBoardId) return b;
      const existing = b.state.pins || [];
      if (existing.some(p => p.id === pin.id)) return b; // avoid dup
      return { ...b, state: { ...b.state, pins: [...existing, pin] } };
    }));
  }, [activeBoardId]);

  const removePin: BoardsCtxVal['removePin'] = React.useCallback((id) => {
    if (!activeBoardId) return;
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, state: { ...b.state, pins: (b.state.pins || []).filter(p => p.id !== id) } } : b));
  }, [activeBoardId]);

  const setNotes: BoardsCtxVal['setNotes'] = React.useCallback((notes) => {
    updateActiveBoardState({ notes });
  }, [updateActiveBoardState]);

  const addWatchTag: BoardsCtxVal['addWatchTag'] = React.useCallback((tag) => {
    if (!activeBoardId) return;
    setBoards(prev => prev.map(b => {
      if (b.id !== activeBoardId) return b;
      const watch = b.state.watch ?? { entities: [], tags: [] };
      if (watch.tags.includes(tag)) return b;
      return { ...b, state: { ...b.state, watch: { ...watch, tags: [...watch.tags, tag] } } };
    }));
  }, [activeBoardId]);

  const removeWatchTag: BoardsCtxVal['removeWatchTag'] = React.useCallback((tag) => {
    if (!activeBoardId) return;
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, state: { ...b.state, watch: { ...(b.state.watch ?? { entities: [], tags: [] }), tags: (b.state.watch?.tags ?? []).filter(t => t !== tag) } } } : b));
  }, [activeBoardId]);

  const addWatchEntity: BoardsCtxVal['addWatchEntity'] = React.useCallback((id) => {
    if (!activeBoardId) return;
    setBoards(prev => prev.map(b => {
      if (b.id !== activeBoardId) return b;
      const watch = b.state.watch ?? { entities: [], tags: [] };
      if (watch.entities.includes(id)) return b;
      return { ...b, state: { ...b.state, watch: { ...watch, entities: [...watch.entities, id] } } };
    }));
  }, [activeBoardId]);

  const removeWatchEntity: BoardsCtxVal['removeWatchEntity'] = React.useCallback((id) => {
    if (!activeBoardId) return;
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, state: { ...b.state, watch: { ...(b.state.watch ?? { entities: [], tags: [] }), entities: (b.state.watch?.entities ?? []).filter(e => e !== id) } } } : b));
  }, [activeBoardId]);

  const value = useMemo(() => ({
    boards,
    activeBoardId,
    setActiveBoardId,
    createBoard,
    deleteBoard,
    updateActiveBoardState,
    addPin,
    removePin,
    setNotes,
    addWatchTag,
    removeWatchTag,
    addWatchEntity,
    removeWatchEntity,
  }), [boards, activeBoardId, createBoard, deleteBoard, updateActiveBoardState, addPin, removePin, setNotes, addWatchTag, removeWatchTag, addWatchEntity, removeWatchEntity]);

  return (
    <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>
  );
};

type BoardsCtxVal = {
  boards: BoardState[];
  activeBoardId: string | null;
  setActiveBoardId: (id: string | null) => void;
  createBoard: (board: Omit<BoardState, 'id' | 'savedAt'>) => BoardState;
  deleteBoard: (id: string) => void;
  updateActiveBoardState: (patch: Partial<BoardState['state']>) => void;
  addPin: (pin: { id: string; type: SelectionItem['type']; title?: string }) => void;
  removePin: (id: string) => void;
  setNotes: (notes: string) => void;
  addWatchTag: (tag: string) => void;
  removeWatchTag: (tag: string) => void;
  addWatchEntity: (id: string) => void;
  removeWatchEntity: (id: string) => void;
};

export const BoardsContext = createContext<BoardsCtxVal | undefined>(undefined);

export const useBoards = () => {
  const ctx = useContext(BoardsContext);
  if (!ctx) throw new Error('useBoards must be used within BoardsProvider');
  return ctx;
};

// Hook moved to separate file to appease fast-refresh and lint rules

