// Moved from src/__tests__/EIADataCacheService.unit.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EIADataCacheService } from './EIADataCacheService';

// TODO: Implement Nostr event validation and spam protection - PRIORITY: MEDIUM
// TODO: Add support for Nostr relay whitelisting and blacklisting - PRIORITY: MEDIUM
describe('EIADataCacheService', () => {
  it('returns cached value on hit', () => {
    const cache = new EIADataCacheService();
    cache.set('foo', 123);
    expect(cache.get('foo')).toBe(123);
  });

  it('expires value after TTL', () => {
    const cache = new EIADataCacheService();
    cache.set('bar', 456, 1); // 1 ms TTL
    vi.useFakeTimers();
    vi.advanceTimersByTime(2);
    expect(cache.get('bar')).toBeNull();
    vi.useRealTimers();
  });

  it('calls observer hooks', () => {
    const cache = new EIADataCacheService();
    const observer = {
      onCacheHit: vi.fn(),
      onCacheMiss: vi.fn(),
      onCacheEvict: vi.fn(),
    };
    cache.setObserver(observer);
    cache.set('baz', 789);
    cache.get('baz'); // hit
    cache.get('missing'); // miss
    cache.delete('baz'); // evict
    expect(observer.onCacheHit).toHaveBeenCalledWith('baz');
    expect(observer.onCacheMiss).toHaveBeenCalledWith('missing');
    expect(observer.onCacheEvict).toHaveBeenCalledWith('baz');
  });
});
