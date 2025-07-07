import React, { memo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { MarketData } from '../../interfaces/Marketplace';

const MarketTable: React.FC = memo(() => {
  const { marketData, isLoading, error } = useMarketplace();

  if (isLoading) {
    return <div>Loading market data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <table className="table-auto w-full border-collapse border border-gray-300">
      <thead>
        <tr>
          <th className="border border-gray-300 px-4 py-2">Item</th>
          <th className="border border-gray-300 px-4 py-2">Price</th>
          <th className="border border-gray-300 px-4 py-2">Volume</th>
        </tr>
      </thead>
      <tbody>
        {marketData.map((item: MarketData) => (
          <tr key={item.id}>
            <td className="border border-gray-300 px-4 py-2">{item.name}</td>
            <td className="border border-gray-300 px-4 py-2">{item.price}</td>
            <td className="border border-gray-300 px-4 py-2">{item.volume}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default MarketTable;