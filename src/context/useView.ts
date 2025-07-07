import { useContext } from 'react';
import { ViewContext } from './ViewContextInstance';
import { ViewContextType } from './ViewContext';

export const useView = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};
