import React, { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { getSingleton, resetSingleton, useSingleton } from '../singleton';

describe('singleton utilities', () => {
  beforeEach(() => {
    resetSingleton('test-key');
    resetSingleton('hot-reload-key');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetSingleton('test-key');
    resetSingleton('hot-reload-key');
  });

  it('dedupes factory calls with getSingleton', () => {
    const factory = jest.fn(() => ({ id: 'only-one' }));
    const first = getSingleton('test-key', factory);
    const second = getSingleton('test-key', factory);

    expect(first).toBe(second);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('warns once on reuse when enabled', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const factory = jest.fn(() => ({ id: 'warned' }));

    getSingleton('test-key', factory, { warnOnReuse: true });
    getSingleton('test-key', factory, { warnOnReuse: true });

    expect(factory).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('keeps singleton across StrictMode double render via useSingleton', () => {
    const factory = jest.fn(() => ({ id: 'strict-singleton' }));
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(StrictMode, null, children);

    const { result, rerender } = renderHook(() => useSingleton('test-key', factory), { wrapper });
    rerender();

    expect(result.current.id).toBe('strict-singleton');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('survives hot-reload style remount without recreating instance', () => {
    const factoryA = jest.fn(() => ({ id: 'original' }));
    const factoryB = jest.fn(() => ({ id: 'should-not-run' }));

    const { unmount } = renderHook(() => useSingleton('hot-reload-key', factoryA));
    unmount();
    const { result: second } = renderHook(() => useSingleton('hot-reload-key', factoryB));

    expect(factoryA).toHaveBeenCalledTimes(1);
    expect(factoryB).not.toHaveBeenCalled();
    expect(second.current.id).toBe('original');
  });
});
