// Investigation Hook
// Custom hook for using the Investigation context

import { useContext } from 'react';
import InvestigationContext from '../context/InvestigationContext';

export const useInvestigation = () => {
  const context = useContext(InvestigationContext);
  if (context === undefined) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};

export default useInvestigation;
