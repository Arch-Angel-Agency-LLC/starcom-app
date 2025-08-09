import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { IntelReportPackageManager } from '../../src/services/IntelReportPackageManager';

const originalFetch = globalThis.fetch;

describe('IntelReportPackageManager.uploadToIPFS (via createPackage)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch as any;
  });

  it('pins manifest to /api/pin and updates distribution + metadata', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      if (typeof url === 'string' && url.includes('/api/pin')) {
        expect(init?.method).toBe('POST');
        return {
          ok: true,
          status: 200,
          json: async () => ({ cid: 'bafyTestCID123' })
        } as any;
      }
      throw new Error('Unexpected fetch URL in test: ' + url);
    }));

    const mgr = new IntelReportPackageManager();
    const reportData: any = {
      id: 'rpt-1',
      title: 'Test Intel Report',
      content: '# Intel Report\nSome content here.',
      classification: 'UNCLASSIFIED',
      priority: 'ROUTINE',
      author: 'Analyst A',
      timestamp: new Date().toISOString(),
      latitude: 37.7749,
      longitude: -122.4194,
      tags: ['osint', 'test'],
      confidence: 80
    };

    const pkg = await mgr.createPackage(reportData, {
      encryption: { enabled: false },
      accessControl: {},
      storage: { primary: 'ipfs', pin: true },
      marketplace: { list: false }
    } as any);

    expect(pkg.metadata.dataPackLocation).toBe('bafyTestCID123');
    expect(pkg.distribution.primaryLocation.address).toBe('ipfs://bafyTestCID123');
    expect(pkg.distribution.primaryLocation.pinned).toBe(true);
  });
});
