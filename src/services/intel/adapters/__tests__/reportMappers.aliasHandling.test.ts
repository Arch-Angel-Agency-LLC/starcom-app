/**
 * reportMappers alias & summary handling tests
 *
 * Verifies:
 *  - manualSummary flag preserves provided summary
 *  - deriveSummary truncates to 240 chars when manualSummary not set
 *  - category array round-trip (first category -> UI.category)
 *  - geo fields (lat/lon) map to latitude/longitude
 */
import { describe, it, expect } from 'vitest';
import { uiToWorkspaceReportData, workspaceFileToUI, deriveSummary } from '../../adapters/reportMappers';
import type { IntelReportUI } from '../../../../types/intel/IntelReportUI';

function makeUI(overrides: Partial<IntelReportUI> = {}): IntelReportUI {
  const now = new Date();
  return {
    id: overrides.id || 'r-1',
    title: overrides.title || 'Alias Handling Report',
    content: overrides.content || 'Line1\n\nLine2 Extended paragraph for summary derivation logic test.',
    author: overrides.author || 'Tester',
    category: overrides.category || 'GENERAL',
    tags: overrides.tags || ['alias','test'],
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    classification: overrides.classification || 'UNCLASSIFIED',
    status: overrides.status || 'DRAFT',
    conclusions: overrides.conclusions || [],
    recommendations: overrides.recommendations || [],
    methodology: overrides.methodology || [],
    confidence: overrides.confidence ?? 0.8,
    priority: overrides.priority || 'ROUTINE',
    targetAudience: overrides.targetAudience || [],
    sourceIntelIds: overrides.sourceIntelIds || [],
    version: overrides.version || 1,
    manualSummary: overrides.manualSummary,
    summary: overrides.summary,
  history: overrides.history || [],
  latitude: overrides.latitude,
  longitude: overrides.longitude
  };
}

describe('reportMappers alias & summary handling', () => {
  it('preserves manual summary when manualSummary flag set', () => {
    const ui = makeUI({ summary: 'Custom Summary', manualSummary: true });
    const data = uiToWorkspaceReportData(ui);
    expect(data.summary).toBe('Custom Summary');
  });

  it('derives summary when manualSummary not set', () => {
    const longContent = Array(50).fill('word').join(' '); // > 240 chars
    const ui = makeUI({ content: longContent, summary: undefined, manualSummary: false });
    const data = uiToWorkspaceReportData(ui);
    expect(data.summary.length).toBeLessThanOrEqual(240);
    expect(data.summary.endsWith('...')).toBe(true);
  });

  it('round-trips categories and geo fields', () => {
    const ui = makeUI({ category: 'THREAT', latitude: 10, longitude: 20 });
    const data = uiToWorkspaceReportData(ui);
  // metadata should always exist and contain categories array + geo object when coords provided
  expect(data.metadata?.categories?.[0]).toBe('THREAT');
  expect(data.metadata?.geo).toEqual({ lat: 10, lon: 20 });
    const file = { path: '', filename: 'f', extension: '.intelReport', reportData: data, size: 0, createdAt: data.createdAt, modifiedAt: data.modifiedAt, checksum: '' } as any;
    const back = workspaceFileToUI(file);
    expect(back.category).toBe('THREAT');
    expect(back.latitude).toBe(10);
    expect(back.longitude).toBe(20);
  });

  it('deriveSummary utility basic behavior', () => {
    const src = 'Para1 first sentence.\n\nPara2 second.';
    const out = deriveSummary(src);
    expect(out).toBe('Para1 first sentence.');
  });
});
