# Runtime Config (config.json)

Purpose
- Avoid rebuilds per environment on static hosting (IPFS).

Pattern
- Place config.json alongside index.html in dist
- Load config.json at app start; merge with build-time defaults

Suggested keys
- network: { solanaCluster, rpcEndpoints[] }
- features: { analyticsEnabled, relayNodeDetection }
- storage: { ipfsGateways[], pinningProvider }

Notes
- Cache-control: allow the app to re-fetch config.json (short max-age) while pin remains stable.
