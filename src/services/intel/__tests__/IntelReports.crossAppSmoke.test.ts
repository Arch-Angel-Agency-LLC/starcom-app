/**
 * Cross-App Intel Reports Smoke Test
 *
 * Validates foundational invariant for consolidation milestone:
 *  - Reports created via intelReportService are globally visible through listReports()
 *  - Update path (saveReport) preserves id/history and surfaces changes
 *  - Status update path works (updateStatus)
 *
 * This is an early Phase 6 smoke – UI-level per-app render assertions for
 * NetRunner, CyberCommand, MarketExchange will follow. Analyzer UI coverage
 * already exists (IntelReportsViewer.provider.test).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { intelReportService } from '../IntelReportService';
import type { CreateIntelReportInput, IntelReportUI } from '../../../types/intel/IntelReportUI';

function makeInput(overrides: Partial<CreateIntelReportInput> = {}): CreateIntelReportInput {
  return {
    title: overrides.title || `Cross-App Report ${Math.random().toString(36).slice(2,7)}`,
    summary: overrides.summary || 'Cross-app smoke summary',
    content: overrides.content || 'Initial content',
    classification: overrides.classification || 'UNCLASSIFIED',
  category: (overrides as any).category || 'GENERAL',
    tags: overrides.tags || ['smoke','cross-app'],
    latitude: overrides.latitude ?? 0,
    longitude: overrides.longitude ?? 0,
  confidence: overrides.confidence ?? 0.7,
  };
}

// NOTE: The current WorkspaceBackedIntelReportService keeps state in-memory.
// We rely on a fresh module context per test file execution. If a reset()
// method is later added, we can call it in beforeEach for explicitness.

describe('IntelReports Cross-App Smoke', () => {
  let createdIds: string[] = [];

  beforeEach(() => {
    createdIds = [];
  });

  it('creates two reports and lists them (global visibility)', async () => {
    const r1 = await intelReportService.createReport(makeInput({ title: 'Smoke R1' }), 'Tester');
    const r2 = await intelReportService.createReport(makeInput({ title: 'Smoke R2', tags: ['smoke','x'] }), 'Tester');
    createdIds.push(r1.id, r2.id);

    const list = await intelReportService.listReports();
    const titles = list.map(r => r.title);
    expect(titles).toContain('Smoke R1');
    expect(titles).toContain('Smoke R2');
  });

  it('updates a report content and status; history/version are preserved', async () => {
    const base = await intelReportService.createReport(makeInput({ title: 'Update Target' }), 'Updater');
    createdIds.push(base.id);

  const edited: IntelReportUI = { ...base, content: base.content + ' :: edited once' };
  await intelReportService.saveReport(edited);
  const afterSave = await intelReportService.getReport(base.id);
  expect(afterSave?.content).toMatch(/edited once/);
  expect(afterSave?.history && afterSave.history.length).toBeGreaterThanOrEqual(2); // CREATED + UPDATED
  expect(afterSave?.version).toBeGreaterThanOrEqual(2); // initial + save

  const submitted = await intelReportService.updateStatus(base.id, 'SUBMITTED');
  expect(submitted?.status).toBe('SUBMITTED');
  expect(submitted?.history?.find(h => h.action === 'STATUS_CHANGED')).toBeTruthy();
  });
});
