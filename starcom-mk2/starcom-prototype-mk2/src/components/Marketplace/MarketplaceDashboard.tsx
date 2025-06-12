import React, { useEffect, useState } from 'react';
import { fetchMarketData } from '../../api/market';
import MarketTable from './MarketTable';

const MarketplaceDashboard: React.FC = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMarketData();
        setMarketData(data);
      } catch (err) {
        setError('Failed to fetch market data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarketData();
  }, []);

  if (isLoading) {
    return <div>Loading market data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="marketplace-dashboard">
      <h1 className="text-2xl font-bold mb-4">Marketplace Dashboard</h1>
      <MarketTable />
    </div>
  );
};

export default MarketplaceDashboard;