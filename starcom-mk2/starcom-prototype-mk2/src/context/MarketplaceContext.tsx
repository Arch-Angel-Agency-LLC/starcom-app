import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { fetchMarketData } from '../api/market';
import { MarketplaceContextType, MarketData } from '../interfaces/Marketplace';
import { handleError } from '../utils/errorHandler';

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

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(marketplaceReducer, initialState);

  const refreshMarketData = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await fetchMarketData();
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      const errorMessage = handleError(err);
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
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

export const useMarketplace = (): MarketplaceContextType => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};