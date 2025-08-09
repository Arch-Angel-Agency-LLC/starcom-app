import React, { useEffect, useState } from 'react';
import { loadRuntimeConfig } from '../../config/runtimeConfig';

const ExperimentalMarketplaceBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const cfg = await loadRuntimeConfig();
        if (cfg.features?.marketplaceServerlessMVP) setShow(true);
      } catch { /* ignore */ }
    })();
  }, []);
  if (!show) return null;
  return (
    <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900" data-testid="experimental-marketplace-banner">
      Experimental Marketplace: data & purchases are transitional (not on-chain). Do not rely on for production trades.
    </div>
  );
};

export default ExperimentalMarketplaceBanner;
