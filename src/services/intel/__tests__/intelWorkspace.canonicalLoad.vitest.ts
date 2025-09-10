import { describe, it, expect } from 'vitest';
import { IntelWorkspaceService } from '../../IntelWorkspaceService';
import type { IntelReportUI } from '../../../types/intel/IntelReportUI';

function build(report: Partial<IntelReportUI> & Pick<IntelReportUI, 'id' | 'title'>): IntelReportUI {
  const now = new Date('2024-03-03T00:00:00Z');
  return {
    id: report.id,
    title: report.title,
    content: report.content ?? 'Body',
    author: report.author ?? 'tester',
    category: report.category ?? 'TEST',
    tags: report.tags ?? [],
    classification: report.classification ?? 'UNCLASSIFIED',
    status: report.status ?? 'DRAFT',
    createdAt: report.createdAt ?? now,
    updatedAt: report.updatedAt ?? now,
    history: report.history ?? []
  };
}

describe('IntelWorkspaceService.loadIntelReportCanonical', () => {
  it('reads and parses canonical JSON via DI reader', async () => {
    const files: Record<string,string> = {};
    const ws = new IntelWorkspaceService({
      fileWriter: async (p,c) => { files[p] = c; },
      fileReader: async (p) => files[p]
    });

    const ui = build({ id: 'ws-load-1', title: 'WS Load Canonical' });
    const save = await ws.saveIntelReportCanonical(ui, '/workspace');
    expect(save.success).toBe(true);

    const res = await ws.loadIntelReportCanonical('/workspace', 'ws-load-1');
    expect(res.errors).toEqual([]);
    expect(res.report?.id).toBe('ws-load-1');
    expect(res.report?.title).toBe('WS Load Canonical');
  });
});
