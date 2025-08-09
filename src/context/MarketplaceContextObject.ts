import { createContext } from 'react';
import type { MarketplaceContextType } from '../interfaces/Marketplace';

export const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);
