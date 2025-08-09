import { describe, it, expect } from 'vitest';
import { cryptoService } from './CryptoService';

describe('CryptoService (Ed25519 MVP)', () => {
  it('generates keypair and signs/verifies text', async () => {
    const kp = await cryptoService.getOrCreateLocalKeyPair();
    const msg = 'hello-' + Math.random();
    const sig = await cryptoService.sign(msg, kp.privateKey);
    const ok = await cryptoService.verify(msg, sig, kp.publicKey);
    expect(ok).toBe(true);
  });

  it('detects tampering', async () => {
    const kp = await cryptoService.getOrCreateLocalKeyPair();
    const msg = 'unchanged';
    const sig = await cryptoService.sign(msg, kp.privateKey);
    const ok = await cryptoService.verify(msg + 'x', sig, kp.publicKey);
    expect(ok).toBe(false);
  });

  it('produces deterministic JSON signatures (key ordering agnostic)', async () => {
    const kp = await cryptoService.getOrCreateLocalKeyPair();
    const obj1 = { b: 2, a: 1 } as const;
    const obj2 = { a: 1, b: 2 } as const;
    const s1 = await cryptoService.signJson(obj1, kp.privateKey);
    const s2 = await cryptoService.signJson(obj2, kp.privateKey);
    expect(s1.signature).toBe(s2.signature);
    const verified = await cryptoService.verifyJson(obj1, s1.signature, kp.publicKey);
    expect(verified).toBe(true);
  });
});
