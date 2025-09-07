export type RuntimeConfig = {
  target?: 'vercel' | 'ipfs';
  routerMode?: 'browser' | 'hash';
  features?: {
    analyticsEnabled?: boolean;
    relayNodeDetection?: boolean;
    serverlessPin?: boolean;
  // When false, hide the floating storage status badge (IPFS: ...)
  storageBadge?: boolean;
  marketplaceServerlessMVP?: boolean; // transitional flag; when false, UI should hide serverless marketplace endpoints
  };
  network?: {
    solanaCluster?: 'mainnet-beta' | 'devnet' | 'testnet';
    rpcEndpoints?: string[];
  };
  storage?: {
    ipfsGateways?: string[];
    pinProvider?: 'pinata' | 'web3storage' | 'none';
  };
};

let cachedConfig: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('config.json not found');
    cachedConfig = await res.json();
    return cachedConfig!;
  } catch {
    // Fallback to env-derived defaults
    const envTarget = (import.meta.env.VITE_TARGET || 'vercel') as 'vercel' | 'ipfs';
    const envRouter = (import.meta.env.VITE_ROUTER_MODE || (envTarget === 'ipfs' ? 'hash' : 'browser')) as 'browser' | 'hash';
    cachedConfig = {
      target: envTarget,
      routerMode: envRouter,
      features: {
        analyticsEnabled: (import.meta.env.VITE_ANALYTICS_ENABLED || '') === 'true',
        relayNodeDetection: true,
        serverlessPin: (import.meta.env.VITE_PIN_API || '') === 'true',
      },
      network: {
        solanaCluster: 'devnet',
        rpcEndpoints: ['https://api.devnet.solana.com']
      },
      storage: {
        ipfsGateways: ['https://ipfs.io/ipfs/'],
        pinProvider: 'none'
      }
    };
    return cachedConfig!;
  }
}
