# Intelligence Market Exchange — Minimal Milestone Plan

Date: 2025-08-08
Owner: Intelligence Market Exchange Working Group
Status: In Progress

## purpose
Stand up a minimal, end-to-end flow that moves the marketplace from mocks to real assets using IPFS, basic cryptography, and a lightweight listings service. Keep it IPFS/Vercel dual-deploy compatible and chain-ready, but start off-chain for speed and safety.

## milestones
- M1 Storage (Enable Real Assets)
  - Add uploadToIPFS in IntelReportPackageManager using the serverless /api/pin.
  - Persist distribution.primaryLocation (ipfs://CID) and metadata.dataPackLocation.
  - Implement loadFromStorage by CID and verify round-trip.
- M2 Crypto (Prove Integrity + Controlled Access)
  - Sign package manifest hash with the connected wallet.
  - Encrypt the DataPack (symmetric key); keep previews unencrypted.
  - Envelope the key to intended recipients (buyer’s public key or escrow key).
- M3 UI + Listings (Make It Real for Users)
  - Introduce a minimal ListingsService + /api/listings (create/query) and /api/purchases (record + key delivery).
  - Wire Marketplace UI (Dashboard/Table/MarketExchange) to real listings; keep mocks as offline fallback.
- M4 Chain-ready (Flip to On-Chain Later)
  - Abstract the payment step; add listener scaffold for on-chain events to gate key release when ready.

## success criteria
- You can: create an IntelReportPackage → upload/pin to IPFS → create a listing → see it in the UI → purchase → receive sealed key → decrypt locally → open content.
- Unit and integration tests cover: pin/upload, round-trip load, sign/verify, encrypt/decrypt, listing CRUD and purchase key delivery.
- No secrets leak to clients; provider keys are server-side only.

## dependencies
- serverless pin endpoint: `/api/pin` (Pinata/Web3.Storage supported; provider override via header/body).
- Runtime config: `public/config.json` with `serverlessPin` and `storage.pinProvider`.
- Router/base config remains IPFS-compatible (hash routing).

## out of scope (for this milestone)
- Full on-chain settlement and escrow.
- Complex licensing, revocation, or DRM.
- Multi-tenant persistence beyond a simple DB/KV for listings/receipts.

## next documents
- IMPLEMENTATION_CHECKLIST.md — step-by-step tasks and acceptance checks.
- API_CONTRACTS.md — minimal data models and REST endpoints for listings/purchases.

## progress updates

- 2025-08-08
  - Implemented serverless endpoints: `/api/listings` (POST/GET) and `/api/purchases` (POST, returns simulated sealed key).
  - Added preliminary tests for endpoints using Vitest.
  - Drafted minimal client-side ListingsService (fetch wrapper) to enable UI wiring in the next step.
