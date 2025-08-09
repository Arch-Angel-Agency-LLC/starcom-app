import React from 'react';
import MarketTable from './MarketTable';
import ExperimentalMarketplaceBanner from './ExperimentalMarketplaceBanner';

const MarketplaceDashboard: React.FC = () => {
  return (
    <div className="marketplace-dashboard">
  <h1 className="text-2xl font-bold mb-4">Marketplace Dashboard</h1>
  <ExperimentalMarketplaceBanner />
      <MarketTable />
    </div>
  );
};

export default MarketplaceDashboard;