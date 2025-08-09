# Intelligence Market Exchange – Parking Lot (Paused Scope)

Status Tag Legend:
- COMPLETE: MVP implemented & tested
- MVP: skeleton in place, needs enhancement
- PENDING: not started
- PLACEHOLDER: interface/stub only

## Components
| Area | Status | Notes / Next Resume Steps |
|------|--------|---------------------------|
| Manifest Pinning (/api/pin + client upload) | COMPLETE | Rate limiting & size guard added; replace with direct client pin or RelayNode when stable. |
| Package Signing (Ed25519) | COMPLETE | Local keypair; replace with wallet-based signing (Solana adapter) + on-chain hash anchor. |
| Encryption & Key Sealing | PENDING | Implement symmetric key per package + recipient envelope; integrate with purchase flow. |
| Access Control Enforcement | PENDING | Evaluate PackageAccessControl during load & key issuance. |
| Purchase Flow (/api/purchases) | MVP | Simulated sealedKey; no payment verification. Replace with on-chain payment evidence + deterministic key derivation. |
| Listings Storage (/api/listings + JSON) | MVP | Transitional persistent JSON; move to on-chain listing anchor. |
| ChainAdapter (Solana) | PLACEHOLDER | Add wallet pubkey retrieval, sign/verify transaction, anchor commit. |
| ChainAdapter (Stellar/multi-chain) | PENDING | Introduce once Solana path validated. |
| Signature Verification in Validation | COMPLETE | Extensible for multi-algo; add PQC/multi-sig in future. |
| Feature Flags (marketplaceServerlessMVP, serverlessPin) | COMPLETE | Ensure disabled in prod when decommissioning endpoints. |
| UI Buy Flow Gating | COMPLETE | Disabled state & notice when marketplaceServerlessMVP=false. |
| On-chain Listing Anchor Program | PENDING | Define account layout: {listingId, seller, price, royalty?, manifestHash, createdAt}. |
| Wallet-based Signing | PENDING | Derive key from connected wallet; remove local storage keypair fallback. |
| Rate Limiting / Abuse Protection | MVP | Basic in-memory for /api/pin. Needs durable/store-backed or edge solution. |
| Test Coverage (flags off-state, rate limit) | PARTIAL | Add tests for Buy disabled & 429 path. |

## Open Technical Debt
- Replace local Ed25519 key persistence with wallet provider & secure keystore.
- Add deterministic canonical manifest builder for CAR file output to stabilize CID across environments.
- Implement content encryption with streaming capability for large datasets.
- Introduce structured error codes for /api/pin & /api/listings to aid future clients.
- Add replay protection / authenticity proof for purchase receipts (currently trivial to forge).
- Harden JSON canonicalization (currently deep sort; consider stable numeric/string handling edge cases).

## Suggested Resume Order
1. Wallet integration & on-chain listing anchor (unblocks trust model shift).
2. Purchase payment verification + key sealing (moves confidential distribution forward).
3. Encryption + access control enforcement.
4. Remove transitional endpoints & clean feature flags.
5. Multi-chain support & advanced crypto (PQC / multi-sig) if still desired.

## Quick Start Notes (When Resuming)
- Run: `npm test` (ensure signature + pin tests remain green)
- Read: DECENTRALIZATION_TRANSITION.md & this file for current state.
- Tag baseline: checkout tag `marketplace-mvp-freeze` (create if not yet).

