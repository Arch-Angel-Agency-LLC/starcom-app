import { describe, it, expect } from 'vitest';
import { IntelWorkspaceService } from '../../IntelWorkspaceService';
import type { IntelReportUI } from '../../../types/intel/IntelReportUI';

describe('IntelWorkspaceService.saveIntelReportCanonical', () => {
  it('serializes and writes schema v1 JSON via DI writer', async () => {
    const writes: Record<string,string> = {};
    const ws = new IntelWorkspaceService({ fileWriter: async (p,c) => { writes[p] = c; } });

    const report: IntelReportUI = {
      id: 'ws-r1',
      title: 'WS Canonical',
      content: 'Body',
      author: 'tester',
      category: 'TEST',
      tags: [],
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      createdAt: new Date('2024-02-02T00:00:00Z'),
      updatedAt: new Date('2024-02-02T00:00:00Z'),
      history: []
    };

    const res = await ws.saveIntelReportCanonical(report, '/workspace');
    expect(res.success).toBe(true);
    const path = '/workspace/ws-r1.intelReport';
    expect(Object.keys(writes)).toContain(path);
    const obj = JSON.parse(writes[path]);
    expect(obj.schema).toBe('intel.report');
    expect(obj.schemaVersion).toBe(1);
    expect(obj.id).toBe('ws-r1');
    expect(obj.title).toBe('WS Canonical');
    expect(obj.createdAt).toBe('2024-02-02T00:00:00.000Z');
  });
});
