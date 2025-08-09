import { describe, it, expect } from 'vitest';
import { IntelReportPackageManager } from '../IntelReportPackageManager';
import { IntelReportData } from '../../models/IntelReportData';
import { cryptoService } from '../crypto/CryptoService';

describe('IntelReportPackageManager signature integration', () => {
  it('creates a package with a valid Ed25519 signature over metadata+datapack subset', async () => {
    const mgr = new IntelReportPackageManager();
    const report: IntelReportData = {
      title: 'Test Intel',
      content: 'Threat actor observed operating in sector X with TTPs Y and Z',
      tags: ['threat', 'actor'],
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now(),
      author: 'dev-wallet-placeholder'
    };
    const pkg = await mgr.createPackage(report, {
      sourceIntelReport: report,
      storage: { primary: 'ipfs', pin: false },
      encryption: { enabled: false },
      accessControl: { publicRead: true }
    });
    expect(pkg.signature.algorithm).toBe('ed25519');
    expect(pkg.signature.signature).toBeTruthy();
    const payload = { metadata: pkg.metadata, dataPack: { id: pkg.dataPack.id, manifest: pkg.dataPack.manifest, contentHash: pkg.dataPack.contentHash } };
  const verified = await cryptoService.verifyJson(payload, pkg.signature.signature, pkg.signature.publicKey);
    expect(verified).toBe(true);
    expect(pkg.signature.contentHash.length).toBe(64);
  });
});
