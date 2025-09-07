import { describe, it, expect } from 'vitest';
import { DraftBuilder } from '../DraftBuilder';

describe('DraftBuilder', () => {
  const board = {
    id: 'b1', name: 'Alpha Board', savedAt: Date.now(),
    state: {
      view: 'table',
      filters: { tags: ['x'] } as any,
      selection: null,
      notes: 'Hypothesis: activity surge near port.',
      pins: [
        { id: 'e1', type: 'event', title: 'Report A' },
        { id: 'e2', type: 'intelItem', title: 'Intel B' }
      ],
      watch: { tags: ['alpha','bravo'], entities: ['ent-1'] }
    }
  } as any;

  it('builds payload with notes summary and citations; includes watch tags when requested', () => {
    const res = DraftBuilder.buildFromBoard(board, {
      title: 'Draft From Alpha',
      classification: 'CONFIDENTIAL',
      includeFilters: true,
      includeWatchlists: true,
      redactSensitive: false
    });

    expect(res.report.title).toBe('Draft From Alpha');
    expect(res.report.classification).toBe('CONFIDENTIAL');
    expect(res.report.summary).toMatch(/Hypothesis/);
    expect(res.report.tags).toEqual(['alpha','bravo']);
    expect(res.citations.length).toBe(2);
    expect(res.report.content).toMatch(/## Evidence/);
  });
});
