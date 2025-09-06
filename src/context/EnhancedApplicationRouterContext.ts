import { createContext } from 'react';
import type { EnhancedApplicationRouterContextType } from '../components/Router/EnhancedApplicationRouter';

// Enhanced Application Router Context
export const EnhancedApplicationRouterContext = createContext<EnhancedApplicationRouterContextType | null>(null);
