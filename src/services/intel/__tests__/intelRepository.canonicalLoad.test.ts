import { describe, it, expect } from 'vitest';
import { IntelRepositoryService } from '../../IntelRepositoryService';
import { SerializedIntelReportV1 } from '../serialization/intelReportSerialization';

describe('IntelRepositoryService.loadCanonicalUIReport', () => {
  it('reads and parses canonical JSON via injected reader', async () => {
    const saved: Record<string,string> = {};
    const r1: SerializedIntelReportV1 = {
      schema: 'intel.report',
      schemaVersion: 1,
      id: 'r1',
      title: 'Load Me',
      content: 'Body',
      author: 'tester',
      category: 'TEST',
      tags: [],
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    const repo = new IntelRepositoryService('/workspace', undefined, {
      fileWriter: async (p, c) => { saved[p] = c; },
      fileReader: async (p) => saved[p] ?? '',
      gitExec: async () => ''
    });

    // write using canonical save
    (repo as any).initialized = true;
    await repo.saveCanonicalUIReport({
      id: r1.id,
      title: r1.title,
      content: r1.content,
      author: r1.author,
      category: r1.category,
      tags: [],
      classification: r1.classification,
      status: r1.status,
      createdAt: new Date(r1.createdAt),
      updatedAt: new Date(r1.updatedAt)
    }, 'Save');

    // now load
    const result = await repo.loadCanonicalUIReport('r1');
    expect(result.errors).toEqual([]);
    expect(result.report?.id).toBe('r1');
    expect(result.report?.title).toBe('Load Me');
  });
});
