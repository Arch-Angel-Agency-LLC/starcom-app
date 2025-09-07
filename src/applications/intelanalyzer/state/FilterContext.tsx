import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Filter Context for Analysis Workbench
 *
 * Manages filters applied across views.
 * Based on data-models.md filters.
 */

export interface FilterState {
  timeRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  entityRefs?: string[];
  categories?: string[];
  confidence?: { min: number; max: number };
  geo?: { polygon: [number, number][] };
  // Add more as per data-models.md
}

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: unknown) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>({});

  const updateFilter = (key: keyof FilterState, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => setFilters({});

  return (
    <FilterContext.Provider value={{
      filters,
      setFilters,
      updateFilter,
      clearFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
