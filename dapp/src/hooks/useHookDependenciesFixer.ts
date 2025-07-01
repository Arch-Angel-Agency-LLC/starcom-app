// Missing imports
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * React Hook Dependencies Fixer
 * Provides utilities to fix common useEffect dependency warnings
 * 
 * AI-NOTE: This utility addresses missing dependency warnings in useEffect hooks
 */

/**
 * Stable callback hook - prevents function recreation on every render
 * Use this for callbacks passed to useEffect to avoid missing dependency warnings
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef<T>(callback);
  
  // Update the ref with the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  // Return stable callback that calls the latest version
  const stableCallback = useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
  
  return stableCallback;
}

/**
 * Previous value hook - prevents unnecessary re-renders
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * Safe async effect hook - prevents state updates after unmount
 */
export function useSafeAsyncEffect(
  effect: (signal: AbortSignal) => Promise<void>,
  deps: React.DependencyList
) {
  const stableEffect = useStableCallback(effect);
  
  useEffect(() => {
    const controller = new AbortController();
    
    stableEffect(controller.signal).catch(error => {
      if (!controller.signal.aborted) {
        console.warn('Async effect error:', error);
      }
    });
    
    return () => {
      controller.abort();
    };
  }, [stableEffect, ...deps]);
}

/**
 * Interval effect hook - safe setInterval with cleanup
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * Event listener hook - safe addEventListener with cleanup
 */
export function useEventListener<T extends keyof WindowEventMap>(
  eventName: T,
  handler: (event: WindowEventMap[T]) => void,
  element: Window | Element | null = window,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef<(event: WindowEventMap[T]) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element?.addEventListener) return;

    const eventListener = (event: WindowEventMap[T]) => {
      if (savedHandler.current) {
        savedHandler.current(event);
      }
    };

    element.addEventListener(eventName, eventListener as EventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener as EventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Local storage hook with safe parsing
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}
