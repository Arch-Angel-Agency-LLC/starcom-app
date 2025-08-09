# Intelligence Market Exchange — Minimal Milestone Implementation Checklist

Use this as a working checklist. Keep PRs small and verifiable. Each task has lightweight acceptance criteria.

## M1 — Storage (Real Assets on IPFS)

- [ ] IntelReportPackageManager.uploadToIPFS
  - Implementation: call `/api/pin` with JSON/CAR; support provider override; return CID.
  - Sets: `package.distribution.primaryLocation = { type: 'ipfs', address: 'ipfs://<cid>', pinned: true, provider }` and `package.metadata.dataPackLocation = <cid>`.
  - Tests: mock `/api/pin` (msw); assert CID wiring and metadata set.
- [ ] Deterministic artifact
  - Implementation: canonicalize DataPack layout; prefer CAR creation with stable ordering.
  - Tests: same input → same CID.
- [ ] loadFromStorage
  - Implementation: fetch by CID; reconstruct `IntelReportPackage` + `IntelReportDataPack`.
  - Tests: upload → load → deep equality (minus non-deterministic fields).

## M2 — Crypto (Integrity + Controlled Access)

- [ ] Signature
  - Implementation: hash manifest; sign with connected wallet (chain-agnostic adapter); store in `package.signature`.
  - Tests: verify signature on load; tamper → verification fails.
- [ ] Encryption
  - Implementation: encrypt DataPack with symmetric key; keep preview assets unencrypted.
  - Key management: envelope symmetric key to recipients (buyer or escrow service key). Store envelope in `distribution.encryptedKeys`.
  - Tests: decrypt with correct key; wrong key fails.
- [ ] Access control
  - Implementation: enforce `PackageAccessControl` at delivery; server-side gate for key release.
  - Tests: unauthorized purchase → key withheld; authorized → key issued.

## M3 — UI + Listings (Real Market Data)

- [ ] ListingsService + Endpoints
  - [x] Endpoints: `POST /api/listings`, `GET /api/listings`, `POST /api/purchases` (in-memory MVP).
  - [ ] Persistence: simple KV/SQLite or filesystem JSON (dev).
  - [x] Tests: basic create/list/filter for listings, purchase receipt creation.
- [ ] Marketplace wiring
  - Implementation: replace mock fetch in MarketplaceDashboard/MarketTable with ListingsService; feature flag to fall back to mocks.
  - UI: show IPFS availability, price, tags, clearance; add Buy flow → purchase endpoint → sealed key receipt.
  - Tests: UI loads real listing; buy flow returns receipt; decrypt button unlocks content.

## M4 — Chain-ready (Toggle Later)

- [ ] Payment abstraction
  - Implementation: interface `PaymentProvider` with off-chain (mock) and on-chain (event-watching) adapters.
  - Tests: swap provider in tests; ensure key release waits for payment confirmation in on-chain mode.

## security + ops

- [ ] Secrets hygiene: storage provider keys only server-side; CORS/origin checks; rate limits; audit logs.
- [ ] Metadata minimization: encrypt sensitive content; previews sanitized.
- [ ] Error modes: timeouts, provider failover, partial pin retries; user-facing error messages.

## acceptance demo (definition of done)

- [ ] End-to-end demo script runs locally: create package → upload → list → purchase → decrypt → verify content.
- [ ] Unit + integration tests pass in CI for the above components.
- [ ] Minimal docs updated: README.md, API_CONTRACTS.md with any field deltas.
