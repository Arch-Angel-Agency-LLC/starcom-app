import { describe, it, expect } from 'vitest';
import { DraftBuilder } from '../DraftBuilder';

const baseBoard = {
  id: 'b3', name: 'Charlie', savedAt: Date.now(),
  state: {
    view: 'table',
    filters: {},
    selection: null,
    notes: 'n',
    pins: [],
    watch: { tags: ['alpha'], entities: ['x','y'] }
  }
} as any;

describe('DraftBuilder classification enforcement', () => {
  it('CONFIDENTIAL forces entity redaction and still includes tags', () => {
    const res = DraftBuilder.buildFromBoard(baseBoard, {
      title: 't', classification: 'CONFIDENTIAL', includeFilters: false, includeWatchlists: true, redactSensitive: false
    });
    expect(res.report.content).toMatch(/## Context: Watchlists/);
    expect(res.report.content).toMatch(/Entities:\s*\[REDACTED\]/);
    expect(res.report.tags).toEqual(['alpha']);
  });

  it('UNCLASSIFIED suppresses watchlist tags and watchlist section', () => {
    const res = DraftBuilder.buildFromBoard(baseBoard, {
      title: 't', classification: 'UNCLASSIFIED', includeFilters: true, includeWatchlists: true, redactSensitive: false
    });
    // No watchlist section
    expect(res.report.content).not.toMatch(/## Context: Watchlists/);
    // Tags list should be empty
    expect(res.report.tags).toEqual([]);
  });
});
