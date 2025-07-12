import { createContext } from 'react';
import type { EnhancedApplicationRouterContextType } from './EnhancedApplicationRouter';

// Enhanced Application Router Context
export const EnhancedApplicationRouterContext = createContext<EnhancedApplicationRouterContextType | null>(null);
