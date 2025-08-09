import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// @ts-ignore - ESM default export from serverless function
import handler from '../../api/pin.js';

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj: any) => {
    res.body = obj;
    return res;
  };
  return res;
}

describe('/api/pin', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch as any;
  });

  it('returns 405 for non-POST', async () => {
    const req: any = { method: 'GET', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.body).toMatchObject({ error: 'Method Not Allowed' });
  });

  it('returns 501 when provider is not configured', async () => {
    delete process.env.PINATA_JWT;
    delete process.env.WEB3STORAGE_TOKEN;
    delete process.env.PIN_PROVIDER;

    const req: any = { method: 'POST', headers: { 'content-type': 'application/json' }, body: { content: { hello: 'world' } } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(501);
    expect(res.body?.error).toBe('Pinning provider not configured');
  });

  it('pins JSON with Pinata and returns cid', async () => {
    process.env.PIN_PROVIDER = 'pinata';
    process.env.PINATA_JWT = 'test-jwt';

    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      expect(url).toContain('pinJSONToIPFS');
      expect(init.method).toBe('POST');
      return {
        ok: true,
        status: 200,
        json: async () => ({ IpfsHash: 'QmPinataCID', PinSize: 42 }),
        text: async () => ''
      } as any;
    }));

    const req: any = { method: 'POST', headers: { 'content-type': 'application/json' }, body: { content: { hello: 'pinata' } } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ cid: 'QmPinataCID', size: 42 });
  });

  it('pins JSON with Web3.Storage and returns cid', async () => {
    process.env.PIN_PROVIDER = 'web3storage';
    process.env.WEB3STORAGE_TOKEN = 'test-token';

    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      expect(url).toContain('web3.storage/upload');
      expect(init.method).toBe('POST');
      return {
        ok: true,
        status: 200,
        json: async () => ({ cid: 'bafyWeb3CID' }),
        text: async () => ''
      } as any;
    }));

    const req: any = { method: 'POST', headers: { 'content-type': 'application/json' }, body: { content: { hello: 'w3s' } } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ cid: 'bafyWeb3CID' });
  });
});
