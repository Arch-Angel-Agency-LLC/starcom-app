import { describe, it, expect } from 'vitest';
import handler from '../../api/purchases.js';

function createMockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.body = obj; return res; };
  return res;
}

function createReq(method, body) {
  return { method, body };
}

describe('/api/purchases', () => {
  it('rejects non-POST', async () => {
    const res = createMockRes();
    await handler(createReq('GET'), res);
    expect(res.statusCode).toBe(405);
  });

  it('creates a receipt on POST', async () => {
    const res = createMockRes();
    await handler(createReq('POST', { listingId: 'listing-1', buyer: '0xabc' }), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.listingId).toBe('listing-1');
    expect(res.body.buyer).toBe('0xabc');
    expect(res.body.sealedKey).toMatch(/^sealed:/);
  });
});
