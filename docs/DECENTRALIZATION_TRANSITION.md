# Decentralization Transition Plan

> Resume Snapshot (Tag: `marketplace-mvp-freeze`)
> If you're picking this up after the pivot, start here:
> 1. Read this section, then delete it once work resumes.
> 2. Current state: Serverless endpoints (`/api/listings`, `/api/purchases`, `/api/pin`) are TRANSITIONAL ONLY and gated by `features.marketplaceServerlessMVP`.
> 3. Cryptographic package signing & manifest re-sign after IPFS upload is implemented (`IntelReportPackageManager`).
> 4. Actionable Next Tasks (when resuming decentralization):
>    - Implement on-chain Listing Anchor program: store { seller, price, manifestHash }.
>    - Client: generate + pin listing manifest (already partially supported) and display anchor vs unanchored state.
>    - Replace `/api/purchases` with trustless payment detection + local key sealing.
>    - Add chain scan -> listings projection (optional indexer) & remove `/api/listings`.
>    - Remove `/api/pin` once client pin reliability confirmed + gateway redundancy added.
> 5. Guardrails: Do NOT enable `marketplaceServerlessMVP` in production; add CI policy if not yet in place.
> 6. Security Focus On Resume: anchor integrity, anti-replay for purchases, deterministic manifest hashing.
> 7. Cleanup On Completion: Delete transitional endpoints + this resume block.


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

