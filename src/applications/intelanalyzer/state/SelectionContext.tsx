import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Selection Context for Analysis Workbench
 *
 * Manages the currently selected item across views.
 * Selection can be an Event, Report, Intel Item, Entity, etc.
 */

export interface SelectionItem {
  id: string;
  type: 'event' | 'report' | 'intelItem' | 'entity';
  data: unknown; // Flexible for different item types
}

interface SelectionContextType {
  selectedItem: SelectionItem | null;
  setSelectedItem: (item: SelectionItem | null) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

interface SelectionProviderProps {
  children: ReactNode;
}

export const SelectionProvider: React.FC<SelectionProviderProps> = ({ children }) => {
  const [selectedItem, setSelectedItem] = useState<SelectionItem | null>(null);

  const clearSelection = () => setSelectedItem(null);

  return (
    <SelectionContext.Provider value={{
      selectedItem,
      setSelectedItem,
      clearSelection
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
