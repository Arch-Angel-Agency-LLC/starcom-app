import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSupportFunnelState } from '../../../hooks/useSupportFunnelState';

describe('useSupportFunnelState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('disables eligibility when flag is off', () => {
    const { result } = renderHook(() => useSupportFunnelState({ enabled: false, snoozeDays: 30 } as any));
    expect(result.current.eligible).toBe(false);
  });

  it('suppresses while snoozed and recovers after expiry', () => {
    const dayMs = 24 * 60 * 60 * 1000;
    const { result, rerender } = renderHook(() => useSupportFunnelState({ enabled: true, snoozeDays: 1 } as any));

    act(() => {
      result.current.markSnooze();
    });
    expect(result.current.eligible).toBe(false);

    act(() => {
      vi.setSystemTime(new Date('2024-01-02T00:00:01Z'));
      rerender();
    });
    expect(result.current.eligible).toBe(true);

    // persisted snooze timestamp should be stored
    const stored = JSON.parse(localStorage.getItem('support_funnel_v1') || '{}');
    expect(stored.snoozeUntil).toBeGreaterThan(dayMs);
  });

  it('persists dismiss and blocks eligibility', () => {
    const { result } = renderHook(() => useSupportFunnelState({ enabled: true, snoozeDays: 30 } as any));

    act(() => {
      result.current.markDismiss();
    });
    expect(result.current.eligible).toBe(false);

    const second = renderHook(() => useSupportFunnelState({ enabled: true, snoozeDays: 30 } as any));
    expect(second.result.current.state.dismissed).toBe(true);
    expect(second.result.current.eligible).toBe(false);
  });

  it('falls back to memory storage when localStorage is blocked', () => {
    const setSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result, rerender } = renderHook(() => useSupportFunnelState({ enabled: true, snoozeDays: 1 } as any));

    act(() => {
      result.current.markSnooze();
    });

    expect(result.current.state.snoozeUntil).toBeGreaterThan(0);
    expect(result.current.eligible).toBe(false);

    act(() => {
      vi.setSystemTime(new Date('2024-01-02T00:00:01Z'));
      rerender();
    });
    expect(result.current.eligible).toBe(true);

    setSpy.mockRestore();
  });
});
