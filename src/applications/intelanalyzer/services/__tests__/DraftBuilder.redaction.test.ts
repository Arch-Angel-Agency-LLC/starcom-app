import { describe, it, expect } from 'vitest';
import { DraftBuilder } from '../DraftBuilder';

describe('DraftBuilder redaction', () => {
  const board = {
    id: 'b2', name: 'Bravo', savedAt: Date.now(),
    state: {
      view: 'graph',
      filters: { timeRange: { start: new Date().toISOString(), end: new Date().toISOString() } } as any,
      selection: null,
      notes: '',
      pins: [],
      watch: { tags: ['secret'], entities: ['agent-47','cell-9'] }
    }
  } as any;

  it('redacts entities list when redactSensitive + includeWatchlists are true', () => {
    const res = DraftBuilder.buildFromBoard(board, {
      title: 'R', classification: 'CONFIDENTIAL', includeFilters: false, includeWatchlists: true, redactSensitive: true
    });
    expect(res.report.content).toMatch(/## Context: Watchlists/);
    expect(res.report.content).toMatch(/Entities:\s*\[REDACTED\]/);
  });
});
