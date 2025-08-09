// Minimal serverless API stub for /api/listings
// MVP: in-memory store, TypeScript, Vercel/Next.js style
import type { NextApiRequest, NextApiResponse } from 'next';

let listings: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create a new listing
    const { cid, name, description, price, tags, classification, preview, provenance } = req.body;
    const id = `listing-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const listing = { id, cid, name, description, price, tags, classification, preview, provenance, createdAt };
    listings.push(listing);
    return res.status(201).json({ id, createdAt });
  }
  if (req.method === 'GET') {
    // Query listings (basic, no filters yet)
    return res.status(200).json(listings);
  }
  res.status(405).end();
}
0