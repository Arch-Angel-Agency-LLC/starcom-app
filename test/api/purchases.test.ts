import { describe, it, expect } from 'vitest';
// @ts-ignore - Import JS serverless function in TS test
import handler from '../../api/purchases.js';

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (obj: any) => { res.body = obj; return res; };
  return res;
}

function createReq(method: string, body?: any) {
  return { method, body } as any;
}

describe('/api/purchases', () => {
  it('rejects non-POST', async () => {
    const res = createMockRes();
    await handler(createReq('GET'), res);
    expect(res.statusCode).toBe(405);
  });

  it('creates a receipt on POST', async () => {
    const res = createMockRes();
    await handler(createReq('POST', { listingId: 'listing-1', buyer: 'So1anaBuyer111111111111111111111111111111' }), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.listingId).toBe('listing-1');
    expect(res.body.buyer).toMatch(/Buyer/);
    expect(res.body.sealedKey).toMatch(/^sealed:/);
  });
});
