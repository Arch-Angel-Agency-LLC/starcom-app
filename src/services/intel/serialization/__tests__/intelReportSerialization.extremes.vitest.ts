import { describe, it, expect } from 'vitest';
import { serializeReport, parseReport } from '../intelReportSerialization';
import type { IntelReportUI } from '../../../../types/intel/IntelReportUI';

function report(overrides: Partial<IntelReportUI> = {}): IntelReportUI {
  const created = new Date(0); // epoch
  const updated = new Date('2100-01-01T00:00:00.000Z');
  return {
    id: 'extreme-1',
    title: 'Extreme Bounds',
    content: 'Body',
    author: 'bounds-user',
    category: 'general',
    tags: ['bounds'],
    classification: 'UNCLASSIFIED',
    status: 'DRAFT',
    createdAt: created,
    updatedAt: updated,
    conclusions: [],
    recommendations: [],
    methodology: [],
    history: [
      { action: 'CREATED', timestamp: created.toISOString(), user: 'u1' },
      { action: 'FORWARD', timestamp: updated.toISOString(), user: 'u2', changes: ['status'] }
    ],
    version: 2,
    ...overrides
  } as IntelReportUI;
}

describe('intelReportSerialization extreme bounds', () => {
  it('round-trips min/max latitude/longitude boundaries', () => {
    const r = report({ latitude: -90, longitude: 180 });
    const { report: round, errors } = parseReport(serializeReport(r));
    expect(errors).toHaveLength(0);
    expect(round?.latitude).toBe(-90);
    expect(round?.longitude).toBe(180);
  });

  it('round-trips epoch and far-future timestamps', () => {
    const r = report();
    const ser = serializeReport(r);
    const { report: round, errors } = parseReport(ser);
    expect(errors).toHaveLength(0);
    expect(round?.createdAt.toISOString()).toBe(new Date(0).toISOString());
    expect(round?.updatedAt.getUTCFullYear()).toBe(2100);
  });
});
