/**
 * CryptoService - Minimal Ed25519 signing & verification utility (transitional)
 *
 * MVP Scope:
 * - Deterministic SHA-256 hashing
 * - Ed25519 keypair generation (ephemeral/localStorage)
 * - Sign & verify raw strings and canonicalised JSON
 * - No network / backend dependency; keys remain client-side
 *
 * Future (not in this MVP): secure wallet integration, PQC signatures, multi-recipient encryption.
 */
import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

export interface KeyPair {
  publicKey: string; // base64
  privateKey: string; // base64
}

export class CryptoService {
  private static instance: CryptoService | null = null;
  private cachedKeyPair: KeyPair | null = null;
  private readonly LS_PUB = 'starcom:ed25519:pub';
  private readonly LS_PRIV = 'starcom:ed25519:priv';

  static getInstance(): CryptoService {
    if (!this.instance) this.instance = new CryptoService();
    return this.instance;
  }

  async getOrCreateLocalKeyPair(): Promise<KeyPair> {
    if (this.cachedKeyPair) return this.cachedKeyPair;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const pub = window.localStorage.getItem(this.LS_PUB);
        const priv = window.localStorage.getItem(this.LS_PRIV);
        if (pub && priv) {
          this.cachedKeyPair = { publicKey: pub, privateKey: priv };
          return this.cachedKeyPair;
        }
      }
    } catch (_) { /* ignore */ }

  // Provide custom sync sha512 implementation (must be set before any key operations)
  (ed25519 as unknown as { etc: { sha512Sync: (...m: Uint8Array[]) => Uint8Array } }).etc.sha512Sync = (...msgs: Uint8Array[]) => sha512(ed25519.etc.concatBytes(...msgs));
  const privRaw = ed25519.utils.randomPrivateKey();
  const pubRaw = ed25519.getPublicKey(privRaw);
    const keypair: KeyPair = {
      publicKey: this.toBase64(pubRaw),
      privateKey: this.toBase64(privRaw)
    };
    this.cachedKeyPair = keypair;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.LS_PUB, keypair.publicKey);
        window.localStorage.setItem(this.LS_PRIV, keypair.privateKey);
      }
    } catch (_) { /* ignore */ }
    return keypair;
  }

  async sign(content: string | Uint8Array, privateKeyBase64: string): Promise<string> {
    const msg = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    const priv = this.fromBase64(privateKeyBase64);
  const sig = ed25519.sign(msg, priv);
    return this.toBase64(sig);
  }

  async verify(content: string | Uint8Array, signatureBase64: string, publicKeyBase64: string): Promise<boolean> {
    const msg = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    const sig = this.fromBase64(signatureBase64);
    const pub = this.fromBase64(publicKeyBase64);
  return ed25519.verify(sig, msg, pub);
  }

  async hash(content: string | Uint8Array): Promise<string> {
    const msg = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    if (globalThis.crypto?.subtle) {
      const uint8 = msg instanceof Uint8Array ? msg : new Uint8Array(msg as ArrayBufferLike);
      const buffer = await globalThis.crypto.subtle.digest('SHA-256', uint8 as unknown as ArrayBuffer);
      const arr = Array.from(new Uint8Array(buffer));
      return arr.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    const { sha256 } = await import('@noble/hashes/sha256');
    const out = sha256(msg);
    return Array.from(out).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async signJson(obj: unknown, privateKeyBase64: string): Promise<{ signature: string; contentHash: string; canonical: string; }>{
    const canonical = this.canonicalize(obj);
    const contentHash = await this.hash(canonical);
    const signature = await this.sign(canonical, privateKeyBase64);
    return { signature, contentHash, canonical };
  }

  async verifyJson(obj: unknown, signature: string, publicKey: string): Promise<boolean> {
    const canonical = this.canonicalize(obj);
    const ok = await this.verify(canonical, signature, publicKey);
    return ok;
  }

  private canonicalize(obj: unknown): string {
    const normalize = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(v => normalize(v));
      if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, normalize(v)] as [string, unknown]);
        return Object.fromEntries(entries);
      }
      return value;
    };
    return JSON.stringify(normalize(obj));
  }

  private toBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  private fromBase64(b64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return arr;
  }
}

export const cryptoService = CryptoService.getInstance();
