# Intelligence Market Exchange — Minimal API Contracts

Status: Implemented (in-memory MVP for dev). Aligns with existing `/api/pin` and runtime config.

## Models (client/server)

- IntelReportPackageSummary
  - id: string (listing id)
  - cid: string (content root CID)
  - name: string
  - description?: string
  - tags?: string[]
  - classification?: 'UNCLASSIFIED' | 'CUI' | 'SECRET' | 'TOP_SECRET' // align with existing types
  - price: number // smallest unit (e.g., USDC 6dp) or ISO 4217 amount; MVP: number in USD
  - preview: {
      thumbnails?: string[] // small, non-sensitive previews served from IPFS or gateway
      excerpts?: string[]
    }
  - distribution: {
      address: `ipfs://${cid}`
      provider?: 'pinata' | 'web3.storage' | string
      pinned: boolean
    }
  - provenance?: {
      createdAt: string
      signer?: string // wallet addr or DID
      signature?: string // manifest signature
    }

- PurchaseReceipt
  - listingId: string
  - buyer: string // wallet address or DID
  - sealedKey: string // base64, symmetric key encrypted to buyer
  - manifestHash: string // integrity anchor
  - timestamp: string
  - txRef?: string // optional on-chain reference

## Endpoints

- POST /api/listings (Implemented: in-memory)
  - Purpose: Create a listing from an existing package (already pinned).
  - Request: {
      cid: string,
      name: string,
      description?: string,
      price: number,
      tags?: string[],
      classification?: string,
      preview?: { thumbnails?: string[]; excerpts?: string[] },
      provenance?: { signer?: string; signature?: string }
    }
  - Response: { id: string, createdAt: string }

- GET /api/listings (Implemented: in-memory)
  - Purpose: Query listings.
  - Query params: q, tags[], category, classification, minPrice, maxPrice, sort (recent|price|popularity)
  - Response: IntelReportPackageSummary[]

- POST /api/purchases (Implemented: in-memory)
  - Purpose: Record a purchase and deliver an encrypted key envelope for the buyer.
  - Request: {
      listingId: string,
      buyer: string,
      paymentRef?: string,
      publicKey?: string // for the envelope; if absent, use wallet-derived key
    }
  - Response: PurchaseReceipt

## Notes
- Auth: gate POST endpoints behind wallet/auth middleware; verify ownership of buyer address (nonce/signature).
- Persistence: MVP can use a local JSON/SQLite; add an interface to swap stores.
- Future: add GET /api/purchases/:id (buyer-only), and webhook/callback for on-chain events when upgrading payment.

## Try it (dev)
- Create listing: POST /api/listings with { cid, name, price }
- List listings: GET /api/listings?q=term
- Purchase: POST /api/purchases with { listingId, buyer }
