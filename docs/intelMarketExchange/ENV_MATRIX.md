# Environment / Feature Flag Matrix

| Key | Location | Values | Purpose | Notes |
|-----|----------|--------|---------|-------|
| VITE_TARGET | build env | vercel | ipfs | Select deployment target (affects base path & router) | ipfs => HashRouter & base './' |
| VITE_ROUTER_MODE | build env | browser | hash | Force router if overriding default | Normally inferred from VITE_TARGET |
| VITE_PIN_API | build env | true/false | Enable client awareness of serverless pin route | Use with features.serverlessPin |
| VITE_SOLANA_DEBUG | build env | true/false | Verbose Solana wallet service logs | Avoid enabling in prod |
| PIN_PROVIDER | server env | pinata | web3storage | Default pin provider selection | Overridden by header/body or runtime config |
| PINATA_JWT | server secret | JWT | Auth for Pinata pinning | Required if PIN_PROVIDER=pinata |
| WEB3STORAGE_TOKEN | server secret | API token | Auth for Web3.Storage pinning | Required if PIN_PROVIDER=web3storage |
| config.json: features.serverlessPin | runtime (public/config.json) | true/false | Allow fallback serverless pin path | Disabled for pure dApp mode |
| config.json: features.marketplaceServerlessMVP | runtime | true/false | Enable transitional listings/purchases | Set false when decommissioning endpoints |
| config.json: storage.pinProvider | runtime | pinata | web3storage | Client preference forwarded to /api/pin | 'none' leaves provider to server env |
| config.json: network.solanaCluster | runtime | devnet|testnet|mainnet-beta | Chain environment | On-chain integration future step |

## Pre-Deploy Checklist (Prod)
- Ensure marketplaceServerlessMVP=false unless explicitly testing transitional marketplace.
- Ensure serverlessPin=false if direct / decentralized pinning path is stable.
- Confirm no secrets referenced in client bundle (grep for PINATA_JWT / WEB3STORAGE_TOKEN).
