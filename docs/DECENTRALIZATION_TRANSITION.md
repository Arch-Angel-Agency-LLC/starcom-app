# Decentralization Transition Plan

This document outlines how the Intelligence Market Exchange migrates from transitional serverless endpoints to a fully dApp-oriented architecture relying on on-chain state + content addressed storage.

## Current Transitional Endpoints

| Endpoint | Purpose (MVP) | To Be Replaced By | Triggers for Removal |
|----------|---------------|-------------------|----------------------|
| `/api/listings` | Create/list listings (JSON persistence) | Client-pinned IPFS manifest + on-chain Listing Anchor (hash + price) | On-chain program deployed & UI reads anchors |
| `/api/purchases` | Simulated purchase & sealed key placeholder | Two-step: on-chain payment (event/memo) + client key derivation | Successful chain payment verification path |
| `/api/pin` | Server-side pin fallback | Direct client pin or decentralized pinning gateway | Reliable client pin + gateway redundancy |

## Target Components

1. **Listing Manifest (Client):** JSON metadata pinned to IPFS; CID hashed on-chain.
2. **On-Chain Listing Anchor:** Stores { seller, price, royalty, manifestHash }.
3. **On-Chain Purchase Evidence:** Transfer / program event referencing listingId (or manifestHash) enabling entitlement verification.
4. **Key Management (Client):** Symmetric key per package encrypted to buyer pubkey; serverless no longer authoritatively issues keys.
5. **Indexer (Optional External Project):** Caches chain + IPFS data for search; fully reconstructable.

## Feature Flags (runtimeConfig.features)
- `marketplaceServerlessMVP`: when false, UI hides serverless listing creation & purchase actions.
- `serverlessPin`: already controls /api/pin usage.

## Migration Phases
1. **Phase A (Now):** Transitional endpoints annotated; flag present.
2. **Phase B:** Add ChainAdapter (Solana first), sign & pin listing manifests client-side, read-only UI can show anchored vs unanchored listings.
3. **Phase C:** Deploy minimal Solana program for listing anchors; store hash + price; UI switches reads to on-chain + IPFS.
4. **Phase D:** Replace /api/purchases with on-chain payment detection; sealed key derived client-side; disable serverless purchase path (flag off).
5. **Phase E:** Introduce Stellar adapter & unify multi-chain strategy; finalize removal of transitional endpoints.

## Removal Criteria Checklist
- [ ] Listing anchor program live & audited (internal)
- [ ] Client manifest hashing & signature verified locally
- [ ] Purchase verification (transaction or event) is trustless
- [ ] Key sealing relies solely on buyer's public key & deterministic process
- [ ] UI respects `marketplaceServerlessMVP=false` without loss of core functionality

## Security Principles
- Minimize trust in mutable centralized state
- Prefer deterministic, content-addressed artifacts (IPFS CIDs) and verifiable on-chain facts
- Keep transitional code clearly marked and easily deletable

## Action Items (Immediate)
- Gate marketplace UI actions by `marketplaceServerlessMVP`
- Introduce ChainAdapter interface scaffolding (no on-chain writes yet)
- Begin client-side manifest creation & hash signing (next step)

