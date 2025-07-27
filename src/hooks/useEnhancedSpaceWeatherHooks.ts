// Enhanced Space Weather Context Hooks
// Phase 1: Foundation Merge - hooks for accessing enhanced space weather context

import { useContext } from 'react';
import EnhancedSpaceWeatherContext from '../context/EnhancedSpaceWeatherContext';

export const useEnhancedSpaceWeatherContext = () => {
  const context = useContext(EnhancedSpaceWeatherContext);
  if (context === undefined) {
    throw new Error('useEnhancedSpaceWeatherContext must be used within an EnhancedSpaceWeatherProvider');
  }
  return context;
};

// For Phase 1 compatibility - can be used as drop-in replacement for legacy useSpaceWeatherContext
export const useSpaceWeatherContextEnhanced = useEnhancedSpaceWeatherContext;
