import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MarketplaceDashboard from '../components/Marketplace/MarketplaceDashboard';

const MarketplaceRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/marketplace" element={<MarketplaceDashboard />} />
    </Routes>
  );
};

export default MarketplaceRoutes;