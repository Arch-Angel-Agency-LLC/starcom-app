// TRANSITIONAL SERVERLESS ENDPOINT (Marketplace MVP)
// -----------------------------------------------------------------------------
// Purpose: Temporary bootstrap listing storage (non-authoritative) prior to
//          on-chain listing anchors + client-side IPFS manifests.
// Decommission Criteria:
//   1. Client pins listing manifest (CID) including price/hash ✅ (partially supported).
//   2. On-chain program stores { seller, price, manifestHash } (NOT IMPLEMENTED).
//   3. UI reads from chain + IPFS; writes bypass this endpoint.
// Post-Migration: Delete this file. Replace create/list flows with chain scan.
// SECURITY: No auth or economic validation. Guard with feature flag
//           features.marketplaceServerlessMVP. Do not rely on in production.
// -----------------------------------------------------------------------------

// Persistent repository (JSON file) fallback to in-memory cache if FS not available.
import { ListingsRepository } from '../src/repositories/ListingsRepository';
const repo = new ListingsRepository();

// Ephemeral list used only for test reset detection (not primary storage once repo persists)
const memoryIds = new Set();

export default async function handler(req, res) {
	try {
		if (req.method === 'POST') {
			const { cid, name, description, price, tags, classification, preview, provenance } = req.body || {};
			if (!cid || !name || typeof price !== 'number') {
				return res.status(400).json({ error: 'cid, name, and numeric price are required' });
			}
			const { id, createdAt } = await repo.create({ cid, name, description, price, tags, classification, preview, provenance });
			memoryIds.add(id);
			return res.status(201).json({ id, createdAt });
		}

		if (req.method === 'GET') {
			const url = new URL(req.url, 'http://localhost');
			const q = url.searchParams.get('q') || '';
			const result = await repo.list(q || undefined);
			return res.status(200).json(result);
		}

		return res.status(405).json({ error: 'Method Not Allowed' });
	} catch (err) {
		console.error('Listings API error:', err);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}

// For testing convenience only
export async function __resetListings() {
	memoryIds.clear();
	// Clear persisted store between tests to keep deterministic counts
	if (process.env.NODE_ENV === 'test') {
		try { await repo.__resetForTests(); } catch { /* ignore */ }
	}
}

