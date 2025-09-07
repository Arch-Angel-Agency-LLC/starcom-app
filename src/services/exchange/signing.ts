import { getPublicKey, sign, verify } from '@noble/ed25519';
import * as Ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import type { PackageManifest } from './types';
// Configure noble-ed25519 to use sha512 for sync operations
// See: https://github.com/paulmillr/noble-ed25519
type NobleEtc = { sha512Sync?: (msg: Uint8Array) => Uint8Array };
(Ed25519 as unknown as { etc: NobleEtc }).etc.sha512Sync = (msg: Uint8Array) => sha512(msg);

type SignatureBlock = { alg: 'ed25519'; pubkey: string; sig: string };
type ManifestMetadata = Record<string, unknown> & { signature?: SignatureBlock };

function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map((v) => stableStringify(v)).join(',')}]`;
  const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

function manifestDigest(manifest: PackageManifest): Uint8Array {
  const meta: ManifestMetadata = { ...(manifest.metadata as ManifestMetadata) };
  // exclude existing signature block from digest if present
  const metaForDigest: ManifestMetadata = meta.signature ? (({ signature: _signature, ...rest }) => rest)(meta) : meta;
  const m: PackageManifest = { ...manifest, metadata: metaForDigest };
  const msg = utf8ToBytes(stableStringify(m));
  return sha256(msg);
}

export function createEd25519Signer(privateKeyHex: string) {
  return async function signManifest(manifest: PackageManifest): Promise<PackageManifest> {
    const digest = manifestDigest(manifest);
    const priv = hexToBytes(privateKeyHex);
    const pub = await getPublicKey(priv);
    const sig = await sign(digest, priv);
    const signatureBlock: SignatureBlock = {
      alg: 'ed25519',
      pubkey: bytesToHex(pub),
      sig: bytesToHex(sig),
    };
    const metadata: ManifestMetadata = { ...((manifest.metadata as ManifestMetadata) || {}), signature: signatureBlock };
    return { ...manifest, metadata };
  };
}

export async function verifyManifestSignature(manifest: PackageManifest): Promise<boolean> {
  const md = (manifest.metadata as ManifestMetadata) || {};
  const signature = md.signature;
  if (!signature || signature.alg !== 'ed25519' || !signature.pubkey || !signature.sig) return false;
  const digest = manifestDigest(manifest);
  try {
    return await verify(hexToBytes(signature.sig), digest, hexToBytes(signature.pubkey));
  } catch {
    return false;
  }
}
