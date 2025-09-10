import { describe, it, expect } from 'vitest';
import { serializeReport, parseReport } from '../intelReportSerialization';
import type { IntelReportUI } from '../../../../types/intel/IntelReportUI';

function sample(overrides: Partial<IntelReportUI> = {}): IntelReportUI {
  const now = new Date();
  return {
    id: overrides.id || 'r-1',
    title: overrides.title || 'Title',
    content: overrides.content || 'Body',
    author: overrides.author || 'alice',
    category: overrides.category || 'general',
    tags: overrides.tags || [],
    classification: overrides.classification || 'UNCLASSIFIED',
    status: overrides.status || 'DRAFT',
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    summary: overrides.summary || 'sum',
    latitude: overrides.latitude,
    longitude: overrides.longitude,
    conclusions: overrides.conclusions || [],
    recommendations: overrides.recommendations || [],
    methodology: overrides.methodology || [],
    confidence: overrides.confidence,
    priority: overrides.priority || 'ROUTINE',
    targetAudience: overrides.targetAudience || [],
    sourceIntelIds: overrides.sourceIntelIds || [],
    version: overrides.version || 3,
    manualSummary: overrides.manualSummary ?? false,
    history: overrides.history || []
  };
}

describe('intelReportSerialization constraints', () => {
  it('flags invalid classification', () => {
    const r = sample({ classification: 'INVALID' as any });
    const ser = serializeReport(r);
    const parsed = parseReport({ ...ser, classification: 'WRONG' });
    expect(parsed.errors).toContain('Invalid classification');
  });

  it('flags invalid status', () => {
    const r = sample();
    const ser = serializeReport(r);
    const parsed = parseReport({ ...ser, status: 'BOGUS' });
    expect(parsed.errors).toContain('Invalid status');
  });

  it('reports missing required field', () => {
    const r = sample();
    const ser = serializeReport(r);
    const { errors } = parseReport({ ...ser, title: undefined });
    expect(errors.some(e => e.includes('Missing required field: title'))).toBe(true);
  });

  it('warns on out-of-range confidence but still parses', () => {
    const r = sample({ confidence: 2 });
    const ser = serializeReport(r);
    const parsed = parseReport(ser);
    expect(parsed.warnings).toContain('confidence out of range');
    // errors contain invalid classification? ensure none for default sample
    expect(parsed.errors.length === 0 || !parsed.errors.includes('Invalid classification')).toBe(true);
  });

  it('preserves version number through round-trip', () => {
    const r = sample({ version: 7 });
    const ser = serializeReport(r);
    const parsed = parseReport(ser);
    expect(parsed.report?.version).toBe(7);
  });
});
