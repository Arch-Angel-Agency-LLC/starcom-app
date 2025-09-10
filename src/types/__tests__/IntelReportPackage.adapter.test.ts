import { describe, it, expect } from 'vitest';
import { toIntelReportUIFromPackage } from '../IntelReportPackage';
// NOTE: This test depends on tsconfig.test.json for TypeScript transpilation.
// It validates the transitional adapter bridging frozen IntelReportPackage -> IntelReportUI.

// Build a minimal IntelReportPackage-like object (JS only to avoid TS parser issues in vitest config).
function buildPackage(overrides = {}) {
  const base = {
    packageId: 'pkg-1',
    version: '1.0.0',
    createdAt: new Date('2025-09-09T00:00:00Z').toISOString(),
    updatedAt: new Date('2025-09-09T00:05:00Z').toISOString(),
    metadata: {
      id: 'rpt-1',
      title: 'Package Title',
      summary: 'Short summary',
      classification: 'UNCLASSIFIED',
      priority: 'FLASH',
      author: 'AuthorA',
      timestamp: Date.now(),
      location: { lat: 10, lng: 20 },
      intelligence: {
        type: 'OSINT',
        confidence: 0.9,
        entitiesCount: 3,
        relationshipsCount: 1,
        keyTags: ['tag1','tag2'],
      },
      dataPackHash: 'hash',
      dataPackSize: 1234,
      dataPackLocation: 'ipfs://hash'
    },
  dataPack: {
      id: 'dp1',
      name: 'dp1-pack',
      version: '1',
      format: 'zip',
      manifestHash: 'mh',
      contentHash: 'ch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manifest: { totalFiles: 0, totalSize: 0, directories: [], files: [] },
      content: 'Full content body'
  },
    signature: {
      algorithm: 'ed25519',
      signature: 'sig',
      publicKey: 'pk',
      signedAt: new Date().toISOString(),
      signedBy: 'signer',
      contentHash: 'hash'
    },
    encryption: undefined,
    accessControl: {
      publicRead: true,
      publicDownload: false,
      requiresWalletAuth: false,
      requiresSubscription: false,
      redistributionAllowed: true,
      commercialUseAllowed: true,
    },
    distribution: {
      primaryLocation: { type: 'ipfs', address: 'ipfs://hash', encryption: false },
      cdnEnabled: false,
      cacheControl: { maxAge: 0, public: true, immutable: false },
      replicationFactor: 1,
      availabilityTarget: 0.99,
      compressionEnabled: false,
      downloadCount: 0,
      popularityScore: 0
    },
    marketplace: undefined
  };
  return { ...base, ...(overrides || {}) };
}

describe('toIntelReportUIFromPackage', () => {
  it('maps essential metadata and coerces FLASH priority to IMMEDIATE', () => {
    const pkg = buildPackage();
  const ui = toIntelReportUIFromPackage(pkg as any);
    expect(ui.id).toBe(pkg.metadata.id);
    expect(ui.title).toBe(pkg.metadata.title);
    expect(ui.summary).toBe(pkg.metadata.summary);
    expect(ui.latitude).toBe(10);
    expect(ui.longitude).toBe(20);
    expect(ui.priority).toBe('IMMEDIATE'); // FLASH -> IMMEDIATE mapping
    expect(ui.status).toBe('DRAFT');
    expect(ui.content).toBe('Full content body');
    expect(ui.tags).toEqual(['tag1','tag2']);
    expect(ui.category).toBe('OSINT');
  });

  it('falls back to legacyId when present', () => {
  const base = buildPackage();
  const pkg = buildPackage({ metadata: { ...base.metadata, legacyId: 'legacy-123' } });
  const ui = toIntelReportUIFromPackage(pkg as any);
    expect(ui.id).toBe('legacy-123');
  });

  it('handles non-string dataPack.content by providing empty string', () => {
  const base = buildPackage();
  const pkg = buildPackage({ dataPack: { ...base.dataPack, content: new ArrayBuffer(8) } });
  const ui = toIntelReportUIFromPackage(pkg as any);
    expect(ui.content).toBe('');
  });

  it('maps empty keyTags to empty tags array', () => {
    const base = buildPackage();
    const pkg = buildPackage({ metadata: { ...base.metadata, intelligence: { ...base.metadata.intelligence, keyTags: [] } } });
    const ui = toIntelReportUIFromPackage(pkg as any);
    expect(ui.tags).toEqual([]);
  });

  it('handles missing location gracefully (latitude/longitude undefined)', () => {
    const base = buildPackage();
    const { location, ...restMeta } = base.metadata as any;
    const pkg = buildPackage({ metadata: { ...restMeta } });
    const ui = toIntelReportUIFromPackage(pkg as any);
    expect(ui.latitude).toBeUndefined();
    expect(ui.longitude).toBeUndefined();
  });

  it('passes through confidence value; undefined confidence stays undefined', () => {
    const base = buildPackage();
    const pkg1 = buildPackage({ metadata: { ...base.metadata, intelligence: { ...base.metadata.intelligence, confidence: 0.42 } } });
    const ui1 = toIntelReportUIFromPackage(pkg1 as any);
    expect(ui1.confidence).toBe(0.42);
    const pkg2 = buildPackage({ metadata: { ...base.metadata, intelligence: { ...base.metadata.intelligence, confidence: undefined } } });
    const ui2 = toIntelReportUIFromPackage(pkg2 as any);
    expect(ui2.confidence).toBeUndefined();
  });
});
