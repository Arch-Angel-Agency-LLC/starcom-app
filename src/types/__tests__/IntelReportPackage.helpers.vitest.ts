import { describe, it, expect } from 'vitest';
import { toIntelReportUIFromPackage, toCreateIntelReportInputFromPackage, toIntelReportPackageFromUI } from '../IntelReportPackage';
import type { IntelReportPackage } from '../IntelReportPackage';
import type { IntelReportUI } from '../intel/IntelReportUI';

function mockPackage(): IntelReportPackage {
  return {
    packageId: 'pkg-1',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      id: 'r1',
      title: 'Pkg Title',
      summary: 'Pkg Summary',
      classification: 'UNCLASSIFIED',
      priority: 'FLASH',
      author: 'authorA',
      timestamp: Date.now(),
      location: { lat: 10, lng: 20 },
      intelligence: { type: 'OSINT', confidence: 0.9, entitiesCount: 0, relationshipsCount: 0, keyTags: ['alpha'] },
      dataPackHash: 'hash',
      dataPackSize: 0,
      dataPackLocation: '',
      legacyId: 'legacy-r1'
    },
    dataPack: { content: 'Full content here' } as any,
    signature: { algorithm: 'ed25519', signature: 'sig', publicKey: 'pk', signedAt: new Date().toISOString(), signedBy: 'authorA', contentHash: 'hash' },
    accessControl: { publicRead: true, publicDownload: true, requiresWalletAuth: false, requiresSubscription: false, redistributionAllowed: true, commercialUseAllowed: false },
    distribution: { primaryLocation: { type: 'ipfs', address: 'Qm...', encryption: false }, cdnEnabled: false, cacheControl: { maxAge: 0, public: true, immutable: false }, replicationFactor: 1, availabilityTarget: 0.99, compressionEnabled: false, downloadCount: 0, popularityScore: 0 },
  } as IntelReportPackage;
}

describe('IntelReportPackage helpers', () => {
  it('converts package -> UI & preserves FLASH priority mapping to IMMEDIATE', () => {
    const pkg = mockPackage();
    const ui = toIntelReportUIFromPackage(pkg);
    expect(ui.priority).toBe('IMMEDIATE');
    expect(ui.id).toBe('legacy-r1');
  });

  it('builds CreateIntelReportInput from package', () => {
    const pkg = mockPackage();
    const input = toCreateIntelReportInputFromPackage(pkg);
    expect(input.title).toBe(pkg.metadata.title);
    expect(input.priority).toBe('IMMEDIATE');
  });

  it('creates minimal package metadata from UI report', () => {
    const report: IntelReportUI = {
      id: 'u1',
      title: 'UI Title',
      content: 'Body',
      summary: 'Sum',
      author: 'auth',
      category: 'general',
      tags: ['t1','t2'],
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      conclusions: [],
      recommendations: [],
      methodology: [],
      targetAudience: [],
      sourceIntelIds: [],
      version: 1,
      history: [],
      manualSummary: true,
      priority: 'PRIORITY'
    };
    const pkgStub = toIntelReportPackageFromUI(report);
    expect(pkgStub.metadata.id).toBe(report.id);
    expect(pkgStub.metadata.priority).toBe('PRIORITY');
  });
});
