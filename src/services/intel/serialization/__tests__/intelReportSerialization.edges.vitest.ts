import { describe, it, expect } from 'vitest';
import { serializeReport, parseReport } from '../intelReportSerialization';
import type { IntelReportUI } from '../../../../types/intel/IntelReportUI';

function base(overrides: Partial<IntelReportUI> = {}): IntelReportUI {
  const now = new Date();
  return {
    id: 'edge-1',
    title: 'Edge Report',
    content: 'Body',
    author: 'edge-user',
    category: 'general',
    tags: ['x'],
    classification: 'UNCLASSIFIED',
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
    conclusions: [],
    recommendations: [],
    methodology: [],
    ...overrides
  };
}

describe('intelReportSerialization edge cases', () => {
  it('preserves history entries ordering and fields', () => {
    const h = [
      { action: 'CREATED', timestamp: new Date(Date.now() - 5000).toISOString(), user: 'u1' },
      { action: 'UPDATED', timestamp: new Date().toISOString(), user: 'u2', changes: ['content'] }
    ];
    const report = base({ history: h, version: 3 });
    const ser = serializeReport(report);
    const { report: round, errors } = parseReport(ser);
    expect(errors).toHaveLength(0);
    expect(round?.history?.length).toBe(2);
    expect(round?.history?.[1].action).toBe('UPDATED');
    expect(round?.version).toBe(3);
  });

  it('handles coordinate precision without loss', () => {
    const report = base({ latitude: 37.7749295, longitude: -122.4194155 });
    const { report: round } = parseReport(serializeReport(report));
    expect(round?.latitude).toBeCloseTo(37.7749295, 7);
    expect(round?.longitude).toBeCloseTo(-122.4194155, 7);
  });

  it('emits warning for confidence out of range high and keeps value', () => {
    const ser = serializeReport(base({ confidence: 5 }));
    // inject invalid confidence to mimic corrupted storage
    const corrupted = { ...ser, confidence: 1.2 };
    const { warnings, report } = parseReport(corrupted);
    expect(warnings.some(w => w.includes('confidence'))).toBe(true);
    expect(report?.confidence).toBe(1.2);
  });

  it('rejects invalid classification enum', () => {
    const ser = serializeReport(base());
    const invalid = { ...ser, classification: 'TOP_SECRET++' } as any;
    const { errors } = parseReport(invalid);
    expect(errors).toContain('Invalid classification');
  });

  it('rejects invalid status enum', () => {
    const ser = serializeReport(base());
    const invalid = { ...ser, status: 'INVALID_STATUS' } as any;
    const { errors } = parseReport(invalid);
    expect(errors).toContain('Invalid status');
  });
});
