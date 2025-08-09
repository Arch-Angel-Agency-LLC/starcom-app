import React, { memo, useState, useEffect } from 'react';
import { useMarketplace } from '../../hooks/useMarketplace';
import { MarketData } from '../../interfaces/Marketplace';
import { ListingsService } from '../../services/market/ListingsService';
import { loadRuntimeConfig } from '../../config/runtimeConfig';

const MarketTable: React.FC = memo(() => {
  const { marketData, isLoading, error } = useMarketplace();
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [serverlessEnabled, setServerlessEnabled] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await loadRuntimeConfig();
        setServerlessEnabled(cfg.features?.marketplaceServerlessMVP !== false);
      } catch {
        setServerlessEnabled(true);
      }
    })();
  }, []);

  const onBuy = async (listingId: string) => {
    try {
      setPurchaseMessage(null);
      // TODO: wire actual wallet address. Using placeholder for MVP.
      const receipt = await ListingsService.purchase({ listingId, buyer: 'placeholder-wallet-address' });
      setPurchaseMessage(`Purchased ${listingId}. Receipt: ${receipt.sealedKey.slice(0, 8)}...`);
    } catch (e) {
      setPurchaseMessage('Purchase failed.');
      console.error(e);
    }
  };

  if (isLoading) {
    return <div>Loading market data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {purchaseMessage && (
        <div className="mb-2 text-sm text-blue-700">{purchaseMessage}</div>
      )}
      {!serverlessEnabled && (
        <div className="mb-3 p-2 text-xs bg-yellow-100 text-yellow-800 rounded">
          Marketplace serverless endpoints disabled (marketplaceServerlessMVP=false). Listings are read-only. Switch to on-chain flow when available.
        </div>
      )}
      <table className="table-auto w-full border-collapse border border-gray-300">
      <thead>
        <tr>
          <th className="border border-gray-300 px-4 py-2">Item</th>
          <th className="border border-gray-300 px-4 py-2">Price</th>
          <th className="border border-gray-300 px-4 py-2">Volume</th>
          <th className="border border-gray-300 px-4 py-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {marketData.map((item: MarketData) => (
          <tr key={item.id}>
            <td className="border border-gray-300 px-4 py-2">{item.name}</td>
            <td className="border border-gray-300 px-4 py-2">{item.price}</td>
            <td className="border border-gray-300 px-4 py-2">{item.volume}</td>
            <td className="border border-gray-300 px-4 py-2">
              <button
                className={`px-3 py-1 rounded text-white ${serverlessEnabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={!serverlessEnabled}
                title={serverlessEnabled ? 'Execute transitional serverless purchase (will be deprecated)' : 'Serverless marketplace disabled; awaiting trustless on-chain purchase'}
                onClick={() => serverlessEnabled && onBuy(item.id)}
              >
                Buy
              </button>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
});

export default MarketTable;