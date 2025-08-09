import { describe, it, expect } from 'vitest';
import handler from '../../api/pin.js';

function createReq() {
  return { method: 'POST', headers: { 'content-type': 'application/json' }, body: { content: { test: 'x' } } } as any;
}

function createRes() {
  const res: any = { statusCode: 200 };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (o: any) => { res.body = o; return res; };
  return res;
}

describe('/api/pin rate limiting', () => {
  it('returns 429 after exceeding burst', async () => {
    let saw429 = false;
    for (let i = 0; i < 40; i++) {
      const res = createRes();
      await handler(createReq(), res);
      if (res.statusCode === 429) { saw429 = true; break; }
    }
    expect(saw429).toBe(true);
  });
});
