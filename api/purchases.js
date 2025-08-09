// TRANSITIONAL SERVERLESS ENDPOINT (Marketplace MVP)
// /api/purchases currently simulates a purchase receipt. This will be removed once:
// 1. Purchases are anchored via on-chain payment (Solana/Stellar) referencing listingId
// 2. Sealed keys are issued only after client-verifiable on-chain evidence
// 3. Client can derive entitlement without trusting this endpoint
// Keep this logic minimal and side-effect free beyond ephemeral receipt creation.

/** @type {{ listingId: string; buyer: string; sealedKey: string; manifestHash: string; timestamp: string; txRef?: string; }[]} */
const purchases = [];

export default async function handler(req, res) {
	try {
		if (req.method !== 'POST') {
			return res.status(405).json({ error: 'Method Not Allowed' });
		}
		const { listingId, buyer, paymentRef, publicKey } = req.body || {};
		if (!listingId || !buyer) {
			return res.status(400).json({ error: 'listingId and buyer are required' });
		}
		// Simulated sealed key (placeholder for envelope encryption)
		const sealedKey = `sealed:${Buffer.from(`${buyer}:${listingId}`).toString('base64url')}`;
		const manifestHash = `mh:${Buffer.from(listingId).toString('base64url')}`;
		const timestamp = new Date().toISOString();
		const receipt = { listingId, buyer, sealedKey, manifestHash, timestamp, txRef: paymentRef };
		purchases.push(receipt);
		return res.status(201).json(receipt);
	} catch (err) {
		console.error('Purchases API error:', err);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}

// For testing convenience only
export function __resetPurchases() {
	purchases.length = 0;
}

