/**
 * Common Console Error Fixes
 * Simple utilities to fix the most frequent console errors in the Starcom dApp
 * 
 * AI-NOTE: This provides immediate fixes for console errors without complex dependencies
 */

/**
 * Safe property access to prevent "Cannot read property of undefined" errors
 */
export function safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  try {
    return path.split('.').reduce((o, p) => (o && o[p]) || defaultValue, obj);
  } catch {
    return defaultValue;
  }
}

/**
 * Safe JSON parsing to prevent console errors
 */
export function safeJsonParse<T>(jsonString: string, defaultValue?: T): T | undefined {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

/**
 * Safe array access to prevent index errors
 */
export function safeArrayGet<T>(array: T[], index: number, defaultValue?: T): T | undefined {
  try {
    return array && array[index] !== undefined ? array[index] : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe function call to prevent "is not a function" errors
 */
export function safeCall<T extends (...args: any[]) => any>(
  fn: T | undefined | null,
  ...args: Parameters<T>
): ReturnType<T> | undefined {
  try {
    return fn && typeof fn === 'function' ? fn(...args) : undefined;
  } catch (error) {
    console.warn('Safe function call failed:', error);
    return undefined;
  }
}

/**
 * Safe state setter to prevent React state errors
 */
export function safeSetState<T>(
  setter: ((value: T) => void) | undefined,
  value: T,
  fallback?: () => void
): void {
  try {
    if (setter && typeof setter === 'function') {
      setter(value);
    } else if (fallback) {
      fallback();
    }
  } catch (error) {
    console.warn('Safe state setter failed:', error);
    if (fallback) {
      fallback();
    }
  }
}

/**
 * Safe async operation to prevent unhandled promise rejections
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    console.warn(errorMessage || 'Async operation failed:', error);
    return undefined;
  }
}

/**
 * Safe DOM manipulation to prevent DOM errors
 */
export function safeDOMOperation(operation: () => void, errorMessage?: string): void {
  try {
    if (typeof document !== 'undefined') {
      operation();
    }
  } catch (error) {
    console.warn(errorMessage || 'DOM operation failed:', error);
  }
}

/**
 * Safe local storage operations
 */
export const safeStorage = {
  get: (key: string, defaultValue?: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Safe number parsing to prevent NaN errors
 */
export function safeParseNumber(value: any, defaultValue: number = 0): number {
  try {
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe boolean parsing
 */
export function safeParseBoolean(value: any, defaultValue: boolean = false): boolean {
  try {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  } catch {
    return defaultValue;
  }
}

/**
 * Safe timeout/interval operations
 */
export const safeTimeout = {
  set: (callback: () => void, delay: number) => {
    try {
      return setTimeout(() => {
        try {
          callback();
        } catch (error) {
          console.warn('Timeout callback error:', error);
        }
      }, delay);
    } catch (error) {
      console.warn('Failed to set timeout:', error);
      return null;
    }
  },
  
  clear: (timeoutId: NodeJS.Timeout | null) => {
    try {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.warn('Failed to clear timeout:', error);
    }
  }
};

/**
 * Console error suppression for known non-critical errors
 */
export function suppressKnownErrors() {
  // List of known non-critical error patterns to suppress
  const knownNonCriticalPatterns = [
    /ResizeObserver loop limit exceeded/,
    /Non-passive event listener/,
    /Warning: componentWillReceiveProps/,
    /Warning: componentWillMount/
  ];

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const message = args.join(' ');
    if (!knownNonCriticalPatterns.some(pattern => pattern.test(message))) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args) => {
    const message = args.join(' ');
    if (!knownNonCriticalPatterns.some(pattern => pattern.test(message))) {
      originalWarn.apply(console, args);
    }
  };
}

/**
 * Initialize safe error handling
 */
export function initSafeErrorHandling() {
  if (import.meta.env.DEV) {
    // Only suppress known non-critical errors in development
    suppressKnownErrors();
    console.log('🛡️ Safe error handling initialized');
  }
}
