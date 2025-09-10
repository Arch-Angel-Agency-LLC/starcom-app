import { describe, it, expect } from 'vitest';
import { uiToWorkspaceReportData, workspaceFileToUI } from '../../adapters/reportMappers';
import type { IntelReportUI } from '../../../../types/intel/IntelReportUI';

describe('reportMappers round-trip', () => {
  it('UI → workspace → UI preserves core fields', () => {
    const now = new Date();
    const ui: IntelReportUI = {
      id: 'rt-1',
      title: 'Round Trip',
      content: 'Some content',
      summary: 'Some summary',
      author: 'Author',
      category: 'General',
      tags: ['A', 'B'],
      latitude: 1,
      longitude: 2,
      createdAt: now,
      updatedAt: now,
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      conclusions: ['C1'],
      recommendations: ['R1'],
      methodology: ['M1'],
      confidence: 0.7,
      priority: 'ROUTINE',
      targetAudience: ['Ops'],
      sourceIntelIds: ['src-1'],
      version: 2,
      manualSummary: true,
      history: []
    };

    const data = uiToWorkspaceReportData(ui);
    const file = { path: '', filename: 'rt-1.intelReport', extension: '.intelReport', reportData: data, size: 0, createdAt: data.createdAt, modifiedAt: data.modifiedAt, checksum: '' };
    const back = workspaceFileToUI(file as any);

    expect(back.id).toBe(ui.id);
    expect(back.title).toBe(ui.title);
    expect(back.content).toBe(ui.content);
    expect(back.category).toBe(ui.category);
    expect(back.tags).toEqual(ui.tags);
    expect(back.latitude).toBe(ui.latitude);
    expect(back.longitude).toBe(ui.longitude);
    expect(back.classification).toBe(ui.classification);
    expect(back.status).toBe(ui.status);
    expect(back.version).toBe(ui.version);
  });
});
