import { useContext } from 'react';
import { BoardsContext } from './BoardsContextInternal';

export const useBoards = () => {
  const ctx = useContext(BoardsContext);
  if (!ctx) throw new Error('useBoards must be used within BoardsProvider');
  return ctx;
};
