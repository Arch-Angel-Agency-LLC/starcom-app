/**
 * Starcom dApp Console Error Resolver
 * Comprehensive solution for identifying and fixing console errors
 * 
 * This file provides immediate fixes for the most common console errors
 * found in the Starcom dApp without introducing new TypeScript issues.
 */

import { conditionalLog } from './featureFlags';

// Safe property access
export function safeProp<T extends Record<string, unknown>>(
  obj: T | null | undefined, 
  key: keyof T, 
  fallback?: unknown
): unknown {
  return obj && obj[key] !== undefined ? obj[key] : fallback;
}

// Safe JSON operations
export function parseJsonSafely<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

// Safe number conversion
export function toNumberSafely(value: unknown, fallback = 0): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

// Safe boolean conversion  
export function toBooleanSafely(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
}

// Safe function execution
export function executeSafely<T>(fn: (() => T) | undefined, fallback?: T): T | undefined {
  try {
    return fn ? fn() : fallback;
  } catch (error) {
    console.warn('Safe execution failed:', error);
    return fallback;
  }
}

// Safe async execution
export async function executeAsyncSafely<T>(
  fn: (() => Promise<T>) | undefined, 
  fallback?: T
): Promise<T | undefined> {
  try {
    return fn ? await fn() : fallback;
  } catch (error) {
    console.warn('Safe async execution failed:', error);
    return fallback;
  }
}

// Safe localStorage operations
export const SafeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : fallback;
    } catch {
      return fallback;
    }
  },

  set(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// React-specific fixes
export const ReactFixes = {
  // Safe key generation for React lists
  generateKey: (item: unknown, index: number): string => {
    if (item && typeof item === 'object' && 'id' in item) {
      return String((item as { id: unknown }).id);
    }
    return `item-${index}`;
  },

  // Safe ref assignment (for mutable refs)
  assignRef<T>(ref: React.MutableRefObject<T> | undefined, value: T): void {
    try {
      if (ref) {
        ref.current = value;
      }
    } catch (error) {
      console.warn('Ref assignment failed:', error);
    }
  },

  // Safe state update
  updateState<T>(
    setter: React.Dispatch<React.SetStateAction<T>> | undefined,
    value: T | ((prev: T) => T)
  ): void {
    try {
      if (setter) {
        setter(value);
      }
    } catch (error) {
      console.warn('State update failed:', error);
    }
  }
};

// Common error patterns and fixes
export const ErrorPatternFixes = {
  // Fix "Cannot read property of undefined"
  safeChain: <T>(obj: unknown, path: string): T | undefined => {
    try {
      return path.split('.').reduce((current: unknown, key: string) => {
        return current && typeof current === 'object' && key in current 
          ? (current as Record<string, unknown>)[key] 
          : undefined;
      }, obj) as T;
    } catch {
      return undefined;
    }
  },

  // Fix "is not a function" errors
  safeInvoke: <T extends unknown[], R>(
    fn: ((...args: T) => R) | undefined,
    ...args: T
  ): R | undefined => {
    try {
      return fn && typeof fn === 'function' ? fn(...args) : undefined;
    } catch (error) {
      console.warn('Function invocation failed:', error);
      return undefined;
    }
  },

  // Fix array access errors
  safeIndex: <T>(array: T[] | undefined, index: number): T | undefined => {
    try {
      return array && array.length > index && index >= 0 ? array[index] : undefined;
    } catch {
      return undefined;
    }
  }
};

// Development-only error monitoring
export function setupErrorMonitoring(): void {
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    conditionalLog.errorMonitoring('🚨 Unhandled Promise Rejection');
    conditionalLog.errorMonitoring('Reason:', event.reason);
    console.trace('Stack trace:');
  });

  // Track general errors
  window.addEventListener('error', (event) => {
    conditionalLog.errorMonitoring('🚨 Unhandled Error');
    conditionalLog.errorMonitoring('Message:', event.message);
    conditionalLog.errorMonitoring('File:', event.filename);
    conditionalLog.errorMonitoring('Line:', event.lineno);
    conditionalLog.errorMonitoring('Column:', event.colno);
  });

  conditionalLog.errorMonitoring('🛡️ Starcom Error Monitoring Active');
}

// Initialize all error handling
export function initializeErrorHandling(): void {
  setupErrorMonitoring();
  conditionalLog.errorMonitoring('✅ Starcom Console Error Handling Initialized');
}
