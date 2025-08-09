import { useContext } from 'react';
import { MarketplaceContext } from '../context/MarketplaceContextObject';
import type { MarketplaceContextType } from '../interfaces/Marketplace';

export const useMarketplace = (): MarketplaceContextType => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
