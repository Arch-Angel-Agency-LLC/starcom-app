export interface MarketData {
  id: string;
  name: string;
  price: number;
  volume: number;
}

export interface MarketplaceContextType {
  marketData: MarketData[];
  isLoading: boolean;
  error: string | null;
  refreshMarketData: () => void;
}