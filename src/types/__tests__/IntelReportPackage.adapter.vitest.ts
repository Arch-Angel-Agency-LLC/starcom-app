import { describe, it, expect } from 'vitest';
import { toIntelReportUIFromPackage } from '../IntelReportPackage';

// Build minimal valid IntelReportPackage object for adapter test
function buildPackage(partial = {}) {
  const base = {
    packageId: 'pkg-test',
    version: '1.0.0',
    createdAt: new Date('2025-09-09T00:00:00Z').toISOString(),
    updatedAt: new Date('2025-09-09T00:05:00Z').toISOString(),
    metadata: {
      id: 'rpt-test',
      title: 'Test Package Title',
      summary: 'Adapter summary',
      classification: 'UNCLASSIFIED',
      priority: 'FLASH',
      author: 'Tester',
      timestamp: Date.now(),
      location: { lat: 12.34, lng: 56.78 },
      intelligence: {
        type: 'OSINT',
        confidence: 0.95,
        entitiesCount: 2,
        relationshipsCount: 1,
        keyTags: ['alpha','beta']
      },
      dataPackHash: 'hash',
      dataPackSize: 123,
      dataPackLocation: 'ipfs://hash'
    },
    dataPack: {
      id: 'dp-test',
      name: 'dp-test-pack',
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
    accessControl: {
      publicRead: true,
      publicDownload: false,
      requiresWalletAuth: false,
      requiresSubscription: false,
      redistributionAllowed: true,
      commercialUseAllowed: true
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
    }
  };
  return { ...base, ...partial };
}

describe('IntelReportPackage → IntelReportUI adapter', () => {
  it('maps core fields & coerces FLASH to IMMEDIATE', () => {
    const pkg = buildPackage();
  const ui = toIntelReportUIFromPackage(pkg as any);
    expect(ui.id).toBe('rpt-test');
    expect(ui.title).toBe('Test Package Title');
    expect(ui.summary).toBe('Adapter summary');
    expect(ui.latitude).toBe(12.34);
    expect(ui.longitude).toBe(56.78);
    expect(ui.priority).toBe('IMMEDIATE'); // FLASH -> IMMEDIATE
    expect(ui.status).toBe('DRAFT');
    expect(ui.content).toBe('Full content body');
    expect(ui.tags).toEqual(['alpha','beta']);
    expect(ui.category).toBe('OSINT');
  });

  it('uses legacyId when provided', () => {
    const pkg = buildPackage({ metadata: { ...buildPackage().metadata, legacyId: 'legacy-999' } });
  const ui = toIntelReportUIFromPackage(pkg as any);
    expect(ui.id).toBe('legacy-999');
  });

  it('falls back to empty content when dataPack.content is non-string', () => {
    const pkg = buildPackage({ dataPack: { ...buildPackage().dataPack, content: new ArrayBuffer(4) } });
  const ui = toIntelReportUIFromPackage(pkg as any);
    expect(ui.content).toBe('');
  });
});
