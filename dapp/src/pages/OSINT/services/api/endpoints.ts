/**
 * OSINT API Endpoints
 * 
 * Defines all the endpoints for the OSINT API services. This centralizes
 * endpoint definitions and ensures consistency across the application.
 */

// API endpoint paths organized by category
export const osintEndpoints = {
  // Search endpoints
  search: {
    universal: '/search',
    entities: '/search/entities',
    relationships: '/search/relationships',
    events: '/search/events',
    darkweb: '/search/darkweb', // Requires authentication
  },
  
  // Entity endpoints
  entities: {
    list: '/entities',
    get: (id: string) => `/entities/${id}`,
    create: '/entities',
    update: (id: string) => `/entities/${id}`,
    delete: (id: string) => `/entities/${id}`,
    relationships: (id: string) => `/entities/${id}/relationships`,
    events: (id: string) => `/entities/${id}/events`,
  },
  
  // Graph endpoints
  graph: {
    network: '/graph/network',
    expandNode: (id: string) => `/graph/expand/${id}`,
    paths: '/graph/paths',
  },
  
  // Timeline endpoints
  timeline: {
    events: '/timeline/events',
    range: '/timeline/range',
    correlate: '/timeline/correlate',
  },
  
  // Blockchain endpoints (all require authentication)
  blockchain: {
    wallets: '/blockchain/wallets',
    getWallet: (address: string) => `/blockchain/wallets/${address}`,
    transactions: '/blockchain/transactions',
    smartContract: (address: string) => `/blockchain/contracts/${address}`,
    tokens: '/blockchain/tokens',
  },
  
  // Dark Web endpoints (all require authentication)
  darkweb: {
    monitor: '/darkweb/monitor',
    domains: '/darkweb/domains',
    forums: '/darkweb/forums',
    marketplaces: '/darkweb/marketplaces',
    credentials: '/darkweb/credentials',
    search: '/darkweb/search'
  },
  
  // Investigation endpoints
  investigations: {
    list: '/investigations',
    get: (id: string) => `/investigations/${id}`,
    create: '/investigations',
    update: (id: string) => `/investigations/${id}`,
    delete: (id: string) => `/investigations/${id}`,
    export: (id: string) => `/investigations/${id}/export`,
    import: '/investigations/import',
  },
  
  // Map endpoints
  map: {
    locations: '/map/locations',
    search: '/map/search',
    heatmap: '/map/heatmap',
    cluster: '/map/cluster',
  },
  
  // OPSEC endpoints (all require authentication)
  opsec: {
    threatScan: '/opsec/threat-scan',
    secureRoute: '/opsec/secure-route',
    identityCheck: '/opsec/identity-check',
  },
};

// Export default for convenience
export default osintEndpoints;
