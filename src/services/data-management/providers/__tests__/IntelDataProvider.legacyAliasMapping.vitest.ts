import { describe, it, expect } from 'vitest';
import { IntelDataProvider, type IntelProviderReport } from '../IntelDataProvider';

// We indirectly exercise legacyToUI by calling the private method through fetchSolanaIntelReports fallback
// Strategy: monkey patch provider to expose legacyToUI via casting and call it with crafted legacy shapes.

function makeLegacy(overrides: Partial<IntelProviderReport> = {}): IntelProviderReport {
  return {
    pubkey: overrides.pubkey || 'legacy-1',
    title: overrides.title || 'Legacy Report',
    content: overrides.content || 'Legacy content body describing something important.',
    tags: overrides.tags || ['legacy','alias'],
    latitude: overrides.latitude ?? 10,
    longitude: overrides.longitude ?? 20,
    timestamp: overrides.timestamp ?? Date.now(),
    author: overrides.author || 'legacy-author',
    classification: overrides.classification,
    source: overrides.source,
    verified: overrides.verified
  };
}

describe('IntelDataProvider legacy → UI alias mapping', () => {
  it('maps legacy classification variants to IntelReportUI.classification', () => {
    const provider = new IntelDataProvider();
    const legacy = makeLegacy({ classification: 'SECRET' as any });
    const ui = (provider as any).legacyToUI(legacy);
    expect(ui.classification).toBe('SECRET');
    const legacy2 = makeLegacy({ classification: 'UNCLASS' as any });
    const ui2 = (provider as any).legacyToUI(legacy2);
    expect(ui2.classification).toBe('UNCLASSIFIED');
  });

  it('produces summary trimmed to 140 chars', () => {
    const provider = new IntelDataProvider();
    const longContent = 'x'.repeat(500);
    const legacy = makeLegacy({ content: longContent });
    const ui = (provider as any).legacyToUI(legacy);
    expect(ui.summary.length).toBeLessThanOrEqual(140);
  });

  it('assigns default confidence and status', () => {
    const provider = new IntelDataProvider();
    const legacy = makeLegacy();
    const ui = (provider as any).legacyToUI(legacy);
    expect(ui.confidence).toBe(0.5);
    expect(ui.status).toBe('DRAFT');
  });

  it('sets createdAt/updatedAt from timestamp', () => {
    const provider = new IntelDataProvider();
    const ts = Date.now() - 10000;
    const legacy = makeLegacy({ timestamp: ts });
    const ui = (provider as any).legacyToUI(legacy);
    expect(ui.createdAt.getTime()).toBe(ts);
    expect(ui.updatedAt.getTime()).toBe(ts);
  });
});
