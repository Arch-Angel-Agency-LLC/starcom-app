import { describe, it, expect } from 'vitest';
import { computeChangedFields, nextVersion, makeHistoryEntry } from '../reportLifecycle';
import { IntelReportUI } from '../../../types/intel/IntelReportUI';

function baseReport(): IntelReportUI {
  const now = new Date();
  return {
    id: 'r1',
    title: 'Title',
    content: 'Body',
    author: 'author',
    category: 'cat',
    tags: ['a'],
    classification: 'UNCLASSIFIED',
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
    conclusions: [],
    recommendations: [],
    methodology: [],
    targetAudience: [],
    sourceIntelIds: [],
    version: 1,
    history: []
  };
}

describe('reportLifecycle helpers', () => {
  it('computeChangedFields none when identical', () => {
    const r1 = baseReport();
    const r2 = { ...r1 };
    expect(computeChangedFields(r1, r2)).toEqual([]);
  });
  it('computeChangedFields detects field changes', () => {
    const r1 = baseReport();
    const r2 = { ...r1, title: 'New Title', tags: ['a','b'] };
    const changes = computeChangedFields(r1, r2).sort();
    expect(changes).toEqual(['tags','title'].sort());
  });
  it('nextVersion increments when changes present', () => {
    const r1 = baseReport();
    const v = nextVersion(r1, ['title'], false);
    expect(v).toBe((r1.version || 1) + 1);
  });
  it('nextVersion increments when status changes even with no field changes', () => {
    const r1 = baseReport();
    const v = nextVersion(r1, [], true, 'SUBMITTED');
    expect(v).toBe((r1.version || 1) + 1);
  });
  it('nextVersion unchanged with no changes or status change', () => {
    const r1 = baseReport();
    const v = nextVersion(r1, [], false);
    expect(v).toBe(r1.version);
  });
  it('makeHistoryEntry uses provided timestamp', () => {
    const ts = '2024-01-01T00:00:00.000Z';
    const entry = makeHistoryEntry({ action: 'UPDATED', timestamp: ts });
    expect(entry.timestamp).toBe(ts);
  });
});
