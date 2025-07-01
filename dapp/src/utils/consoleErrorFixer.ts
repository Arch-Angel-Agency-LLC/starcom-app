/**
 * Console Error Fixer Utility
 * Identifies and provides solutions for common console errors in the dApp
 * 
 * AI-NOTE: This utility addresses the most common console error patterns found in the Starcom dApp
 */

export interface ConsoleErrorPattern {
  pattern: RegExp;
  errorType: 'warning' | 'error' | 'info';
  description: string;
  solution: string;
  component?: string;
}

export const COMMON_ERROR_PATTERNS: ConsoleErrorPattern[] = [
  {
    pattern: /Warning.*useEffect.*missing dependency/i,
    errorType: 'warning',
    description: 'useEffect hook is missing dependencies in dependency array',
    solution: 'Add missing dependencies to useEffect dependency array or use useCallback for functions',
    component: 'React Hooks'
  },
  {
    pattern: /Warning.*Each child in a list should have a unique "key" prop/i,
    errorType: 'warning',
    description: 'Missing key props in rendered lists',
    solution: 'Add unique key prop to each item in mapped arrays',
    component: 'React Lists'
  },
  {
    pattern: /Cannot read propert.*of undefined/i,
    errorType: 'error',
    description: 'Attempting to access property of undefined object',
    solution: 'Add null/undefined checks or use optional chaining (?.)',
    component: 'Data Access'
  },
  {
    pattern: /Cannot read propert.*of null/i,
    errorType: 'error',
    description: 'Attempting to access property of null object',
    solution: 'Add null checks or use optional chaining (?.)',
    component: 'Data Access'
  },
  {
    pattern: /Maximum call stack size exceeded/i,
    errorType: 'error',
    description: 'Infinite recursion in component rendering or function calls',
    solution: 'Check for circular dependencies in useEffect or recursive function calls',
    component: 'React Lifecycle'
  },
  {
    pattern: /Warning.*Function components cannot be given refs/i,
    errorType: 'warning',
    description: 'Trying to assign ref to functional component',
    solution: 'Use forwardRef() or pass ref as a prop with different name',
    component: 'React Refs'
  },
  {
    pattern: /Failed to load resource.*404/i,
    errorType: 'error',
    description: 'Asset or API endpoint not found',
    solution: 'Check file path and ensure asset exists. Use relative paths instead of aliases for Vercel compatibility.',
    component: 'Asset Loading'
  },
  {
    pattern: /ChunkLoadError/i,
    errorType: 'error',
    description: 'Failed to load JavaScript chunk',
    solution: 'Check Vite configuration and ensure proper dynamic imports',
    component: 'Build System'
  },
  {
    pattern: /Warning.*componentWillMount.*deprecated/i,
    errorType: 'warning',
    description: 'Using deprecated React lifecycle method',
    solution: 'Replace componentWillMount with useEffect hook',
    component: 'React Lifecycle'
  },
  {
    pattern: /Unhandled Promise rejection/i,
    errorType: 'error',
    description: 'Promise rejection not caught',
    solution: 'Add .catch() handler or use try-catch with async/await',
    component: 'Promise Handling'
  }
];

/**
 * Console Error Monitor
 * Captures and categorizes console errors for debugging
 */
export class ConsoleErrorMonitor {
  private static instance: ConsoleErrorMonitor;
  private errorLog: Array<{
    timestamp: Date;
    type: string;
    message: string;
    stack?: string;
    pattern?: ConsoleErrorPattern;
  }> = [];

  private constructor() {
    this.setupErrorCapture();
  }

  static getInstance(): ConsoleErrorMonitor {
    if (!ConsoleErrorMonitor.instance) {
      ConsoleErrorMonitor.instance = new ConsoleErrorMonitor();
    }
    return ConsoleErrorMonitor.instance;
  }

  private setupErrorCapture() {
    // Capture console.error calls
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      this.logError('error', args.join(' '));
      originalError.apply(console, args);
    };

    // Capture console.warn calls
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      this.logError('warning', args.join(' '));
      originalWarn.apply(console, args);
    };

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('error', `Unhandled Promise Rejection: ${event.reason}`);
    });

    // Capture window errors
    window.addEventListener('error', (event) => {
      this.logError('error', event.message, event.error?.stack);
    });
  }

  private logError(type: string, message: string, stack?: string) {
    const matchedPattern = COMMON_ERROR_PATTERNS.find(pattern => 
      pattern.pattern.test(message)
    );

    this.errorLog.push({
      timestamp: new Date(),
      type,
      message,
      stack,
      pattern: matchedPattern
    });

    // Keep only last 100 errors to prevent memory bloat
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  getErrorSummary() {
    const summary = {
      totalErrors: this.errorLog.length,
      errorsByType: {} as Record<string, number>,
      recentErrors: this.errorLog.slice(-10),
      knownPatterns: this.errorLog.filter(e => e.pattern).length,
      unknownErrors: this.errorLog.filter(e => !e.pattern).length
    };

    this.errorLog.forEach(error => {
      summary.errorsByType[error.type] = (summary.errorsByType[error.type] || 0) + 1;
    });

    return summary;
  }

  getSolutionsForRecentErrors() {
    return this.errorLog
      .filter(error => error.pattern)
      .slice(-10)
      .map(error => ({
        message: error.message,
        solution: error.pattern!.solution,
        component: error.pattern!.component,
        timestamp: error.timestamp
      }));
  }

  clearErrorLog() {
    this.errorLog = [];
  }
}

/**
 * Development Error Helper
 * Shows solutions for common console errors in development
 */
export function showConsoleErrorHelp() {
  if (import.meta.env.DEV) {
    const monitor = ConsoleErrorMonitor.getInstance();
    const summary = monitor.getErrorSummary();
    const solutions = monitor.getSolutionsForRecentErrors();

    console.group('🛠️ Starcom dApp - Console Error Analysis');
    console.log('📊 Error Summary:', summary);
    
    if (solutions.length > 0) {
      console.group('💡 Solutions for Recent Errors:');
      solutions.forEach(solution => {
        console.log(`❌ Error: ${solution.message.substring(0, 100)}...`);
        console.log(`✅ Solution: ${solution.solution}`);
        console.log(`🔧 Component: ${solution.component}`);
        console.log('---');
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

/**
 * Safe Error Boundary for Console Errors
 * Prevents console errors from breaking the app
 */
export function safeConsoleCall(fn: () => void, fallback?: () => void) {
  try {
    fn();
  } catch (error) {
    console.warn('Console error prevented:', error);
    if (fallback) {
      fallback();
    }
  }
}

/**
 * Initialize console error monitoring in development
 */
export function initConsoleErrorMonitoring() {
  if (import.meta.env.DEV) {
    ConsoleErrorMonitor.getInstance();
    
    // Show error help after 5 seconds
    setTimeout(() => {
      showConsoleErrorHelp();
    }, 5000);

    // Add global function for manual error checking
    (window as Window & typeof globalThis & { showStarcomErrors?: () => void }).showStarcomErrors = () => showConsoleErrorHelp();
    
    console.log('🛠️ Starcom Console Error Monitoring Active');
    console.log('💡 Type "showStarcomErrors()" in console to see error analysis');
  }
}
