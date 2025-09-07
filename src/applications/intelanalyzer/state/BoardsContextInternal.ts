import { createContext } from 'react';
import type { BoardState, PinnedItem } from './BoardsTypes';

export type BoardsContextValue = {
  boards: BoardState[];
  activeBoardId: string | null;
  setActiveBoardId: (id: string | null) => void;
  createBoard: (board: Omit<BoardState, 'id' | 'savedAt'>) => BoardState;
  deleteBoard: (id: string) => void;
  updateActiveBoardState: (patch: Partial<BoardState['state']>) => void;
  addPin: (pin: PinnedItem) => void;
  removePin: (id: string) => void;
  setNotes: (notes: string) => void;
  addWatchTag: (tag: string) => void;
  removeWatchTag: (tag: string) => void;
  addWatchEntity: (id: string) => void;
  removeWatchEntity: (id: string) => void;
};

export const BoardsContext = createContext<BoardsContextValue | undefined>(undefined);
