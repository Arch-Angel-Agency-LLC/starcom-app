import { describe, it, expect, beforeEach } from 'vitest';
import { buildCreateIntelReportInput } from '../IntelReport';

// Clear localStorage between tests to avoid interference with workspace-based services
beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});

describe('NetRunner CreateIntelReportInput builder replacement', () => {
  it('buildCreateIntelReportInput creates expected CreateIntelReportInput', () => {
    const input = buildCreateIntelReportInput({
      title: 'Title',
      content: 'body',
      summary: 'sum',
      category: 'catA',
      tags: ['t1'],
      confidence: 0.8,
      keyFindings: ['k1'],
      latitude: 10,
      longitude: 20
    });
    expect(input.title).toBe('Title');
    expect(input.summary).toBe('sum');
    expect(input.content).toBe('body');
    expect(input.category).toBe('catA');
    expect(input.tags).toEqual(['t1']);
    expect(input.classification).toBe('UNCLASSIFIED');
    expect(input.latitude).toBe(10);
    expect(input.longitude).toBe(20);
    expect(input.status).toBe('DRAFT');
    expect(input.conclusions).toEqual(['k1']);
    expect(input.confidence).toBeCloseTo(0.8);
  });
});
