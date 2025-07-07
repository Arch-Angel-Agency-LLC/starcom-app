/**
 * React Performance Optimization Hooks - Tests
 * 
 * This file provides tests for the React-idiomatic performance optimization hooks
 * that replace the monolithic PerformanceOptimizationManager.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQueryCache, useVirtualization, useLazyLoading, usePerformanceMonitor } from '../hooks';
import { BaseEntity } from '../types/intelDataModels';

// Mock performance.now
const originalPerformanceNow = performance.now;
let mockTime = 1000;

vi.spyOn(performance, 'now').mockImplementation(() => {
  return mockTime;
});

// Helper to advance mock time
function advanceTime(ms: number) {
  mockTime += ms;
}

// Mock localStorage
const mockLocalStorage = {
  storage: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.storage.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockLocalStorage.storage.delete(key);
  }),
  clear: vi.fn(() => {
    mockLocalStorage.storage.clear();
  })
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage
});

describe('useQueryCache hook', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockTime = 1000;
  });
  
  it('should execute query and cache results', async () => {
    // Mock query function
    const mockQueryFn = vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const query = { types: ['node'] };
    
    // First call should query and cache
    const { result, rerender } = renderHook(() => 
      useQueryCache(mockQueryFn, query)
    );
    
    // Initially it should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for query to resolve
    await vi.runAllTimersAsync();
    
    // Should have queried and not be loading anymore
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([{ id: '1' }, { id: '2' }]);
    expect(result.current.isCached).toBe(false);
    
    // Second call with same query should use cache
    mockQueryFn.mockClear();
    rerender();
    
    // Should immediately have data from cache
    expect(mockQueryFn).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([{ id: '1' }, { id: '2' }]);
    expect(result.current.isCached).toBe(true);
    
    // Should update cache stats
    expect(result.current.cacheStats.hitCount).toBeGreaterThan(0);
    expect(result.current.cacheStats.hitRate).toBeGreaterThan(0);
  });
  
  it('should refresh data when requested', async () => {
    // Mock query function
    const mockQueryFn = vi.fn()
      .mockResolvedValueOnce([{ id: '1' }, { id: '2' }])
      .mockResolvedValueOnce([{ id: '1' }, { id: '2' }, { id: '3' }]);
    
    const query = { types: ['node'] };
    
    // First call to populate cache
    const { result } = renderHook(() => 
      useQueryCache(mockQueryFn, query)
    );
    
    // Wait for query to resolve
    await vi.runAllTimersAsync();
    
    // Should have initial data
    expect(result.current.data).toEqual([{ id: '1' }, { id: '2' }]);
    
    // Manually refresh to bypass cache
    mockQueryFn.mockClear();
    await act(async () => {
      await result.current.refresh();
    });
    
    // Should have called query again and updated data
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
    expect(result.current.isCached).toBe(false);
  });
  
  it('should persist cache to localStorage when configured', async () => {
    // Mock query function
    const mockQueryFn = vi.fn().mockResolvedValue([{ id: '1' }]);
    const query = { types: ['node'] };
    
    // Enable persistence
    renderHook(() => 
      useQueryCache(mockQueryFn, query, { persistToStorage: true })
    );
    
    // Wait for query to resolve
    await vi.runAllTimersAsync();
    
    // Should have stored in localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    expect(mockLocalStorage.storage.size).toBe(1);
  });
});

describe('useVirtualization hook', () => {
  it('should calculate virtual items based on scroll position', () => {
    // Mock a large list
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: `item-${i}` }));
    
    // Initial render with scroll at top
    const { result } = renderHook(() => 
      useVirtualization(items, { itemHeight: 50 })
    );
    
    // Should have initial items rendered
    expect(result.current.virtualItems.length).toBeGreaterThan(0);
    expect(result.current.virtualItems.length).toBeLessThan(items.length);
    expect(result.current.totalHeight).toBe(50 * items.length);
    
    // First item should be at the top
    expect(result.current.virtualItems[0].index).toBe(0);
    expect(result.current.virtualItems[0].style.top).toBe(0);
    
    // Test scrolling
    const scrollEvent = {
      target: { scrollTop: 500 } // Scroll down to item 10 (500 / 50 = 10)
    };
    
    act(() => {
      result.current.containerProps.onScroll(scrollEvent as any);
    });
    
    // Should have adjusted items based on scroll
    expect(result.current.virtualItems[0].index).toBeGreaterThan(5);
  });
  
  it('should scroll to specific index when requested', () => {
    // Mock DOM element
    const mockScrollTo = vi.fn();
    const mockRef = {
      current: {
        scrollTop: 0,
        set scrollTop(value: number) {
          this._scrollTop = value;
          mockScrollTo(value);
        },
        get scrollTop() {
          return this._scrollTop;
        },
        _scrollTop: 0
      }
    };
    
    vi.spyOn(React, 'useRef').mockReturnValue(mockRef as any);
    
    // Mock a large list
    const items = Array.from({ length: 100 }, (_, i) => ({ id: `item-${i}` }));
    
    // Render hook
    const { result } = renderHook(() => 
      useVirtualization(items, { itemHeight: 50 })
    );
    
    // Scroll to item 20
    act(() => {
      result.current.scrollToIndex(20);
    });
    
    // Should have scrolled to correct position (20 * 50 = 1000)
    expect(mockScrollTo).toHaveBeenCalledWith(1000);
  });
});

describe('useLazyLoading hook', () => {
  it('should load fields in priority order', async () => {
    // Mock basic entity
    const basicEntity: BaseEntity = {
      id: 'entity-1',
      type: 'node',
      createdAt: new Date().toISOString()
    };
    
    // Mock load function
    const mockLoadFields = vi.fn().mockImplementation((id, fields) => {
      return Promise.resolve(
        fields.reduce((acc, field) => {
          acc[field] = `${field}-value`;
          return acc;
        }, {} as Partial<BaseEntity>)
      );
    });
    
    // Render hook
    const { result } = renderHook(() => 
      useLazyLoading(basicEntity, mockLoadFields, {
        priorityFields: ['title', 'summary'],
        secondaryFields: ['description'],
        deferredFields: ['fullContent']
      })
    );
    
    // Initially should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Should load priority fields first
    await vi.runAllTimersAsync();
    
    expect(mockLoadFields).toHaveBeenCalledWith('entity-1', expect.arrayContaining(['title', 'summary']));
    
    // Advance time to allow secondary fields to load
    advanceTime(500);
    await vi.runAllTimersAsync();
    
    // Should have loaded secondary fields
    expect(mockLoadFields).toHaveBeenCalledWith('entity-1', expect.arrayContaining(['description']));
    
    // Advance more time for deferred fields
    advanceTime(500);
    await vi.runAllTimersAsync();
    
    // Should have loaded deferred fields
    expect(mockLoadFields).toHaveBeenCalledWith('entity-1', expect.arrayContaining(['fullContent']));
    
    // Entity should have all fields
    expect(result.current.entity).toHaveProperty('title');
    expect(result.current.entity).toHaveProperty('summary');
    expect(result.current.entity).toHaveProperty('description');
    expect(result.current.entity).toHaveProperty('fullContent');
    
    // Should not be loading anymore
    expect(result.current.isLoading).toBe(false);
    
    // Should have 100% progress
    expect(result.current.progress).toBe(1);
  });
  
  it('should allow manually loading specific fields', async () => {
    // Mock basic entity
    const basicEntity: BaseEntity = {
      id: 'entity-1',
      type: 'node',
      createdAt: new Date().toISOString()
    };
    
    // Mock load function
    const mockLoadFields = vi.fn().mockImplementation((id, fields) => {
      return Promise.resolve(
        fields.reduce((acc, field) => {
          acc[field] = `${field}-value`;
          return acc;
        }, {} as Partial<BaseEntity>)
      );
    });
    
    // Render hook with empty field lists to prevent auto-loading
    const { result } = renderHook(() => 
      useLazyLoading(basicEntity, mockLoadFields, {
        priorityFields: [],
        secondaryFields: [],
        deferredFields: []
      })
    );
    
    // Initially should not be loading
    expect(result.current.isLoading).toBe(false);
    
    // Manually load a specific field
    await act(async () => {
      await result.current.loadField('comments');
    });
    
    // Should have loaded just that field
    expect(mockLoadFields).toHaveBeenCalledWith('entity-1', ['comments']);
    expect(result.current.entity).toHaveProperty('comments', 'comments-value');
  });
});

describe('usePerformanceMonitor hook', () => {
  beforeEach(() => {
    mockTime = 1000;
  });
  
  it('should measure operation timing', async () => {
    // Render hook
    const { result } = renderHook(() => 
      usePerformanceMonitor()
    );
    
    // Start an operation
    act(() => {
      result.current.startOperation('testOperation');
    });
    
    // Advance time
    advanceTime(100);
    
    // End the operation
    let duration: number | undefined;
    act(() => {
      duration = result.current.endOperation('testOperation');
    });
    
    // Should have measured approximately 100ms
    expect(duration).toBeCloseTo(100, 0);
  });
  
  it('should collect FPS and render time metrics', async () => {
    // Mock requestAnimationFrame to trigger frames
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      advanceTime(16); // ~60fps
      setTimeout(() => cb(mockTime), 0);
      return 1;
    };
    
    // Render hook
    const { result, rerender } = renderHook(() => 
      usePerformanceMonitor()
    );
    
    // Wait for metrics to be collected
    await vi.advanceTimersByTimeAsync(2000);
    rerender();
    
    // Should have FPS metrics
    expect(result.current.metrics.fps).not.toBeNull();
    
    // Cleanup
    window.requestAnimationFrame = originalRAF;
  });
  
  it('should detect performance warnings', async () => {
    // Mock a low FPS situation
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      advanceTime(50); // ~20fps (below default 30fps threshold)
      setTimeout(() => cb(mockTime), 0);
      return 1;
    };
    
    // Render hook with warning thresholds
    const { result, rerender } = renderHook(() => 
      usePerformanceMonitor({
        warningThresholds: {
          lowFps: 30
        }
      })
    );
    
    // Wait for warnings to be collected
    await vi.advanceTimersByTimeAsync(2000);
    rerender();
    
    // Should have warnings
    expect(result.current.warnings.length).toBeGreaterThan(0);
    expect(result.current.warnings[0]).toContain('Low FPS');
    
    // Cleanup
    window.requestAnimationFrame = originalRAF;
  });
});

// Restore original performance.now
afterAll(() => {
  performance.now = originalPerformanceNow;
});
