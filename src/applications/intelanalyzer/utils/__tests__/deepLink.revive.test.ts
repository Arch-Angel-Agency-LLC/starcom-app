import { describe, it, expect } from 'vitest';
import { reviveFilterState } from '../deepLink';

describe('reviveFilterState', () => {
  it('revives timeRange start/end into Date instances', () => {
    const raw: any = { timeRange: { start: '2024-01-01T00:00:00.000Z', end: '2024-01-02T12:34:56.000Z' }, tags: ['a'] };
    const revived = reviveFilterState(raw);
    expect(revived.timeRange.start).toBeInstanceOf(Date);
    expect(revived.timeRange.end).toBeInstanceOf(Date);
    expect((revived.timeRange.start as Date).toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect((revived.timeRange.end as Date).toISOString()).toBe('2024-01-02T12:34:56.000Z');
    // unchanged other fields
    expect(revived.tags).toEqual(['a']);
  });

  it('is stable if no timeRange present', () => {
    const raw: any = { tags: ['x'] };
    const revived = reviveFilterState(raw);
    expect(revived).toEqual(raw);
  });
});
