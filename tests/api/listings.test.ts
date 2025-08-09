import { describe, it, expect, beforeEach } from 'vitest';
// @ts-ignore - ESM default export from serverless function
import handler, { __resetListings } from '../../api/listings.js';

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (obj: any) => { res.body = obj; return res; };
  return res;
}

function createReq(method: string, body?: any, url: string = 'http://localhost/api/listings') {
  return { method, body, url } as any;
}

describe('/api/listings', () => {
  beforeEach(() => __resetListings());

  it('rejects unsupported methods', async () => {
    const res = createMockRes();
    await handler(createReq('PUT'), res);
    expect(res.statusCode).toBe(405);
  });

  it('creates a listing on POST and returns id', async () => {
    const res = createMockRes();
    await handler(createReq('POST', { cid: 'bafy123', name: 'Test Asset', price: 10 }), res);
    expect(res.statusCode).toBe(201);
    expect(res.body?.id).toMatch(/listing-/);
  });

  it('lists created items and supports basic q filter', async () => {
    const res1 = createMockRes();
    await handler(createReq('POST', { cid: 'bafy1', name: 'Alpha Report', price: 5, tags: ['osint'] }), res1);
    const res2 = createMockRes();
    await handler(createReq('POST', { cid: 'bafy2', name: 'Bravo Dossier', price: 7, tags: ['sigint'] }), res2);

    const resAll = createMockRes();
    await handler(createReq('GET'), resAll);
    expect(resAll.statusCode).toBe(200);
    expect(resAll.body?.length).toBe(2);

    const resFiltered = createMockRes();
    await handler(createReq('GET', undefined, 'http://localhost/api/listings?q=bravo'), resFiltered);
    expect(resFiltered.statusCode).toBe(200);
    expect(resFiltered.body?.length).toBe(1);
    expect(resFiltered.body?.[0]?.name).toContain('Bravo');
  });
});
