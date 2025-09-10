import { describe, it, expect } from 'vitest';
import { IntelRepositoryService } from '../../IntelRepositoryService';
import { IntelReportUI } from '../../../types/intel/IntelReportUI';

// Minimal canonical save test using DI seam (no subclassing / decorators).
// Focus: ensure serializeReport output shape & file path produced.

describe('IntelRepositoryService.saveCanonicalUIReport', () => {
  it('serializes and writes canonical IntelReportUI via injected writer', async () => {
    const writes: Record<string,string> = {};
    const repo = new IntelRepositoryService('/workspace', undefined, {
      fileWriter: async (p, c) => { writes[p] = c; },
      gitExec: async () => '' // no-op git
    });

    // Mark repo initialized to allow optional commit branch without real git.
    (repo as any).initialized = true;

    const report: IntelReportUI = {
      id: 'r1',
      title: 'Test Canonical Report',
      content: 'Body',
      author: 'tester',
      category: 'TEST',
      tags: ['a','b'],
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      history: []
    };

    const result = await repo.saveCanonicalUIReport(report, 'Add canonical report');
    expect(result).toBeDefined();
    expect(Object.keys(writes)).toContain('reports/r1.intelReport');
    const saved = JSON.parse(writes['reports/r1.intelReport']);
    expect(saved.schema).toBe('intel.report');
    expect(saved.schemaVersion).toBe(1);
    expect(saved.id).toBe('r1');
    expect(saved.title).toBe('Test Canonical Report');
    expect(saved.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(saved.updatedAt).toBe('2024-01-01T00:00:00.000Z');
  });
});
