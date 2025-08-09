// Vercel Serverless Function: /api/pin
// Purpose: Accept content and pin it to IPFS via a provider (e.g., Pinata).
// Note: Requires provider credentials configured in environment variables.
// - PINATA_JWT  (recommended)
// - or WEB3STORAGE_TOKEN (alternative, not implemented here)

// Uses Node 18+ built-in fetch, FormData, and Blob

// Simple in-memory rate limiter (best-effort; resets on cold start)
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 30; // max requests per IP per window
const ipBuckets = new Map(); // ip -> { count, windowStart }

function rateLimit(ip) {
  const now = Date.now();
  const rec = ipBuckets.get(ip) || { count: 0, windowStart: now };
  if (now - rec.windowStart > RATE_WINDOW_MS) {
    rec.count = 0;
    rec.windowStart = now;
  }
  rec.count += 1;
  ipBuckets.set(ip, rec);
  return rec.count <= RATE_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();
    if (!rateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    const contentType = req.headers['content-type'] || '';
    let payload;

    if (contentType.includes('application/json')) {
      payload = req.body;
    } else {
      // Attempt to parse as text / fallback
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      payload = JSON.parse(raw);
    }
    if (!payload || typeof payload !== 'object' || !('content' in payload)) {
      return res.status(400).json({ error: 'Missing content in request body' });
    }

    // Determine provider after we have payload (so we can read overrides)
    const headerOverride = (req.headers['x-pin-provider'] || '').toString().toLowerCase();
    const bodyOverride = (payload && payload.options && typeof payload.options === 'object' && payload.options.pinProvider)
      ? String(payload.options.pinProvider).toLowerCase()
      : '';
    const providerPref = headerOverride || bodyOverride || (process.env.PIN_PROVIDER || '').toLowerCase();
    const usePinata = providerPref === 'pinata' || (!providerPref && !!process.env.PINATA_JWT);
    const useW3S = providerPref === 'web3storage' || (!providerPref && !!process.env.WEB3STORAGE_TOKEN);
    if (!usePinata && !useW3S) {
      return res.status(501).json({
        error: 'Pinning provider not configured',
        note: 'Set PIN_PROVIDER=pinata with PINATA_JWT, or PIN_PROVIDER=web3storage with WEB3STORAGE_TOKEN.'
      });
    }

    const { content } = payload;
    // Basic size guard (~2MB JSON/string). For binary, rely on provider limits but still clamp.
    const approxSize = typeof content === 'string' ? content.length : Buffer.byteLength(JSON.stringify(content));
    if (approxSize > 2_000_000) {
      return res.status(413).json({ error: 'Payload too large (2MB limit for transitional endpoint)' });
    }

    // If binary array present, pin as file/blob
    const isBinary = content && typeof content === 'object' && Array.isArray(content.binary);
    if (isBinary) {
      const bytes = Uint8Array.from(content.binary);
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);
      const blob = new Blob([ab], { type: 'application/octet-stream' });

      if (usePinata) {
        const form = new FormData();
        form.append('file', blob, 'content.bin');
        const resp = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
          body: form
        });
        if (!resp.ok) {
          const text = await resp.text();
          return res.status(resp.status).json({ error: 'Provider error', details: text });
        }
        const result = await resp.json();
        const cid = result.IpfsHash || result.cid || result.Hash;
        const size = result.PinSize || result.size || blob.size;
        if (!cid) return res.status(502).json({ error: 'Invalid provider response' });
        return res.status(200).json({ cid, size });
      } else {
        // Web3.Storage: upload raw blob body
        const resp = await fetch('https://api.web3.storage/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.WEB3STORAGE_TOKEN}` },
          body: blob
        });
        if (!resp.ok) {
          const text = await resp.text();
          return res.status(resp.status).json({ error: 'Provider error', details: text });
        }
        const result = await resp.json();
        const cid = result.cid || result.IpfsHash || result.Hash;
        const size = blob.size;
        if (!cid) return res.status(502).json({ error: 'Invalid provider response' });
        return res.status(200).json({ cid, size });
      }
    }

    // JSON path
    if (usePinata) {
      const resp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
      });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: 'Provider error', details: text });
      }
      const result = await resp.json();
      const cid = result.IpfsHash || result.cid || result.Hash;
      const size = result.PinSize || result.size || JSON.stringify(content).length;
      if (!cid) return res.status(502).json({ error: 'Invalid provider response' });
      return res.status(200).json({ cid, size, transitional: true });
    } else {
      const blob = new Blob([JSON.stringify(content)], { type: 'application/json' });
      const resp = await fetch('https://api.web3.storage/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WEB3STORAGE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: blob
      });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: 'Provider error', details: text });
      }
      const result = await resp.json();
      const cid = result.cid || result.IpfsHash || result.Hash;
      const size = blob.size;
      if (!cid) return res.status(502).json({ error: 'Invalid provider response' });
      return res.status(200).json({ cid, size, transitional: true });
    }
  } catch (e) {
    console.error('Pin API error:', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
