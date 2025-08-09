import { describe, it, expect, vi, afterEach } from 'vitest';
import { IntelReportPackageManager } from '../../src/services/IntelReportPackageManager';

const originalFetch = globalThis.fetch;

describe('IntelReportPackageManager.loadManifestFromCID', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch as any;
  });

  it('fetches and validates a minimal manifest by CID', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      expect(url).toContain('bafyLoadCID');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          packageId: 'pkg_abc',
          version: '1.0.0',
          metadata: { title: 'Test', classification: 'UNCLASSIFIED', dataPackHash: 'h123' },
          dataPack: { id: 'dp_1', contentHash: 'ch123', manifest: { totalFiles: 1 } }
        })
      } as any;
    }));

    const mgr = new IntelReportPackageManager();
    const manifest = await mgr.loadManifestFromCID('bafyLoadCID');
    expect(manifest.packageId).toBe('pkg_abc');
    expect(manifest.metadata.title).toBe('Test');
    expect(manifest.dataPack.manifest).toBeTruthy();
  });
});
