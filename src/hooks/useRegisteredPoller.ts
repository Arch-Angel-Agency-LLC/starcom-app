import { useEffect, useRef } from 'react';
import { pollerRegistry, type PollerFn, type PollerHandle, type PollerOptions } from '../services/pollerRegistry';

interface UseRegisteredPollerOptions extends PollerOptions {
  deps?: unknown[];
}

export const useRegisteredPoller = (
  key: string,
  fn: PollerFn,
  options: UseRegisteredPollerOptions,
): PollerHandle => {
  const savedFn = useRef(fn);
  savedFn.current = fn;

  useEffect(() => {
    const handle = pollerRegistry.register(key, (signal) => savedFn.current(signal), options);
    return () => handle.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options.deps ?? []);

  return {
    key,
    scope: options.scope,
    stop: () => pollerRegistry.stop(key),
    runNow: () => pollerRegistry.runNow(key),
    isActive: () => pollerRegistry.isActive(key),
  };
};
