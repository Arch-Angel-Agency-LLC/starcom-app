// Minimal serverless API stub for /api/purchases
// MVP: in-memory store, TypeScript, Vercel/Next.js style
import type { NextApiRequest, NextApiResponse } from 'next';

let purchases: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Record a purchase and deliver a sealed key envelope
    const { listingId, buyer, paymentRef, publicKey } = req.body;
    // Simulate key envelope (not real crypto)
    const sealedKey = `sealed-key-for-${buyer}-${listingId}`;
    const manifestHash = `hash-${listingId}`;
    const timestamp = new Date().toISOString();
    const receipt = { listingId, buyer, sealedKey, manifestHash, timestamp, txRef: paymentRef };
    purchases.push(receipt);
    return res.status(201).json(receipt);
  }
  res.status(405).end();
}
