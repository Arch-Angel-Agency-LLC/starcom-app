import { describe, it, expect } from 'vitest';
import { serializeReport, parseReport } from '../intelReportSerialization';
import type { IntelReportUI } from '../../../../types/intel/IntelReportUI';

function makeSample(overrides: Partial<IntelReportUI> = {}): IntelReportUI {
  const now = new Date();
  return {
    id: 'intel-rt-1',
    title: 'Round Trip Test',
    content: 'Body content',
    author: 'tester',
    category: 'general',
    tags: ['a','b'],
    classification: 'UNCLASSIFIED',
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
    summary: 'Short summary',
    latitude: 10.5,
    longitude: -20.25,
    conclusions: ['c1'],
    recommendations: ['r1'],
    methodology: ['m1'],
    confidence: 0.7,
    priority: 'ROUTINE',
    targetAudience: ['ops'],
    sourceIntelIds: ['intel-x'],
    version: 2,
    manualSummary: true,
    history: [{ action: 'CREATED', timestamp: now.toISOString(), user: 'tester' }],
    ...overrides
  };
}

describe('intelReportSerialization round-trip', () => {
  it('serializes and parses back with data fidelity', () => {
    const original = makeSample();
    const ser = serializeReport(original);
    expect(ser.schema).toBe('intel.report');
    const { report, errors } = parseReport(ser);
    expect(errors).toHaveLength(0);
    expect(report).toBeTruthy();
    expect(report?.title).toBe(original.title);
    expect(report?.conclusions).toEqual(['c1']);
    expect(report?.recommendations).toEqual(['r1']);
    expect(report?.methodology).toEqual(['m1']);
    expect(report?.latitude).toBe(10.5);
    expect(report?.longitude).toBe(-20.25);
    expect(report?.confidence).toBe(0.7);
    expect(report?.version).toBe(2);
  });

  it('captures warnings for out-of-range confidence but still parses', () => {
    const bad = makeSample({ confidence: 2 });
    const ser = serializeReport(bad);
    const { report, warnings, errors } = parseReport({ ...ser, confidence: 1.5 });
    expect(errors).toHaveLength(0);
    expect(warnings.length).toBeGreaterThan(0);
    expect(report?.confidence).toBe(1.5);
  });

  it('reports errors for invalid schema header', () => {
    const ser = serializeReport(makeSample());
    const broken = { ...ser, schema: 'wrong' };
    const { errors } = parseReport(broken);
    expect(errors).toContain('Invalid schema header or version');
  });
});
