import { describe, it, expect } from 'vitest';
import { PackageComposer } from '../PackageComposer';
import { createEd25519Signer, verifyManifestSignature } from '../signing';

// Deterministic private key for test (DO NOT USE IN PROD)
const TEST_PRIV = '1a'.repeat(32);

describe('signing', () => {
  it('signs and verifies a manifest', async () => {
    const { manifest } = PackageComposer.compose({
      name: 'Signed Package',
      description: 'test',
      classification: 'UNCLASSIFIED',
      license: 'CC0',
      author: 'tester',
      reports: [],
      intel: [],
      assets: [],
    });
    const signManifest = createEd25519Signer(TEST_PRIV);
    const signed = await signManifest(manifest);
    expect((signed.metadata as any).signature).toBeDefined();
    const ok = await verifyManifestSignature(signed);
    expect(ok).toBe(true);
  });
});
