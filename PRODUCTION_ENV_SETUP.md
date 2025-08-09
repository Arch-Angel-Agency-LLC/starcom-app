## Production Environment Setup

Targets: Vercel (web2) & IPFS (web3 static)

1. Secrets / Env Vars
	- PINATA_JWT or WEB3STORAGE_TOKEN (optional transitional pinning).
	- VITE_TARGET=vercel (default) or ipfs.
	- VITE_ROUTER_MODE (optional override) browser|hash.
2. Runtime Config
	- Provide `public/config.json` to tweak gateways, feature flags without rebuild.
3. Build Commands
	- Vercel: `npm run build` (auto). IPFS: set env VITE_TARGET=ipfs then build.
4. Artifact Validation
	- Dist served under root (vercel) or /ipfs/<CID>/ (gateway). Check deep links & asset paths.
5. Transitional Flags
	- Set `features.marketplaceServerlessMVP=false` once on-chain listing/purchase path live.
6. Monitoring
	- Track rate limit responses on `/api/pin` (429) to detect abuse.
