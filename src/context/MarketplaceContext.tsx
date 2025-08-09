import React, { useReducer, useEffect } from 'react';
import { ListingsService } from '../services/market/ListingsService';
import { MarketData } from '../interfaces/Marketplace';
import { handleError } from '../utils/errorHandler';
import { MarketplaceContext } from './MarketplaceContextObject';
import { fetchMarketData } from '../api/market';

interface MarketplaceState {
  marketData: MarketData[];
  isLoading: boolean;
  error: string | null;
}

type MarketplaceAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: MarketData[] }
  | { type: 'FETCH_ERROR'; payload: string };

const initialState: MarketplaceState = {
  marketData: [],
  isLoading: false,
  error: null,
};

const marketplaceReducer = (state: MarketplaceState, action: MarketplaceAction): MarketplaceState => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, marketData: action.payload };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(marketplaceReducer, initialState);

  const refreshMarketData = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const listings = await ListingsService.list();
      const data: MarketData[] = listings.map(l => ({
        id: l.id,
        name: l.name,
        price: l.price,
        // No on-chain volume yet; set to 0 for MVP
        volume: 0
      }));
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      // Fallback to mock market endpoint if available
      try {
        const fallbackData = await fetchMarketData();
        dispatch({ type: 'FETCH_SUCCESS', payload: fallbackData as MarketData[] });
  } catch (_e) {
        const errorMessage = handleError(err);
        dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
      }
    }
  };

  useEffect(() => {
    refreshMarketData();
  }, []);

  return (
    <MarketplaceContext.Provider value={{ ...state, refreshMarketData }}>
      {children}
    </MarketplaceContext.Provider>
  );
};

// Hook moved to hooks/useMarketplace.ts to satisfy Fast Refresh constraints