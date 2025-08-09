// Minimal client wrapper for /api/listings and /api/purchases
export type CreateListingRequest = {
  cid: string;
  name: string;
  description?: string;
  price: number;
  tags?: string[];
  classification?: string;
  preview?: { thumbnails?: string[]; excerpts?: string[] };
  provenance?: { signer?: string; signature?: string; createdAt?: string };
};

export type Listing = CreateListingRequest & {
  id: string;
  createdAt: string;
};

export type PurchaseRequest = {
  listingId: string;
  buyer: string;
  paymentRef?: string;
  publicKey?: string;
};

export type PurchaseReceipt = {
  listingId: string;
  buyer: string;
  sealedKey: string;
  manifestHash: string;
  timestamp: string;
  txRef?: string;
};

export class ListingsService {
  static async createListing(payload: CreateListingRequest): Promise<{ id: string; createdAt: string }> {
    const resp = await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) throw new Error(`Create listing failed: ${resp.status}`);
    return resp.json();
  }

  static async list(q?: string): Promise<Listing[]> {
    const url = new URL('/api/listings', window.location.origin);
    if (q) url.searchParams.set('q', q);
    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`List listings failed: ${resp.status}`);
    return resp.json();
  }

  static async purchase(payload: PurchaseRequest): Promise<PurchaseReceipt> {
    const resp = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) throw new Error(`Purchase failed: ${resp.status}`);
    return resp.json();
  }
}
