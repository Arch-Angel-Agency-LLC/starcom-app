/**
 * Enhanced wallet connection utilities with exponential backoff and proper error handling
 */

export interface ConnectionWaitOptions {
  maxAttempts?: number;
  initialInterval?: number;
  maxInterval?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
}

/**
 * Waits for wallet connection with exponential backoff
 * This prevents tight polling loops and reduces performance impact
 */
export const waitForWalletConnection = (
  checkConnection: () => boolean,
  options: ConnectionWaitOptions = {}
): Promise<void> => {
  const {
    maxAttempts = 10,
    initialInterval = 100,
    maxInterval = 1000,
    backoffMultiplier = 1.5,
    timeoutMs = 30000
  } = options;

  return new Promise((resolve, reject) => {
    let attempts = 0;
    let currentInterval = initialInterval;
    let totalTime = 0;

    const checkConnectionState = () => {
      // Check if connection is established
      if (checkConnection()) {
        resolve();
        return;
      }

      attempts++;
      totalTime += currentInterval;

      // Check timeout
      if (totalTime >= timeoutMs) {
        reject(new Error(`Connection timeout after ${timeoutMs}ms`));
        return;
      }

      // Check max attempts
      if (attempts >= maxAttempts) {
        reject(new Error(`Connection failed after ${maxAttempts} attempts`));
        return;
      }

      // Exponential backoff
      currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
      
      setTimeout(checkConnectionState, currentInterval);
    };

    // Start checking immediately
    checkConnectionState();
  });
};

/**
 * Enhanced connection state validator with detailed error reporting
 */
export const validateConnectionState = (
  wallet: unknown,
  connected: boolean,
  publicKey: unknown
): { isValid: boolean; error?: string; details?: Record<string, boolean> } => {
  // Check wallet selection
  if (!wallet) {
    return {
      isValid: false,
      error: 'No wallet selected',
      details: { wallet: false, connected, publicKey: !!publicKey }
    };
  }

  // Check adapter availability
  if (!wallet || typeof wallet !== 'object' || !('adapter' in wallet) || !(wallet as { adapter?: unknown }).adapter) {
    return {
      isValid: false,
      error: 'Wallet adapter not available',
      details: { wallet: true, adapter: false, connected, publicKey: !!publicKey }
    };
  }

  // Check connection status
  if (!connected) {
    return {
      isValid: false,
      error: 'Wallet not connected',
      details: { wallet: true, adapter: true, connected: false, publicKey: !!publicKey }
    };
  }

  // Check public key
  if (!publicKey) {
    return {
      isValid: false,
      error: 'No public key available',
      details: { wallet: true, adapter: true, connected: true, publicKey: false }
    };
  }

  return {
    isValid: true,
    details: { wallet: true, adapter: true, connected: true, publicKey: true }
  };
};

/**
 * Recovery strategy circuit breaker to prevent infinite loops
 */
export class RecoveryCircuitBreaker {
  private attemptCounts: Map<string, number> = new Map();
  private readonly maxAttempts: number;
  private readonly resetTimeMs: number;
  private lastResetTime: number = Date.now();

  constructor(maxAttempts: number = 3, resetTimeMs: number = 300000) { // 5 minutes
    this.maxAttempts = maxAttempts;
    this.resetTimeMs = resetTimeMs;
  }

  canAttempt(strategy: string): boolean {
    this.resetIfNeeded();
    const attempts = this.attemptCounts.get(strategy) || 0;
    return attempts < this.maxAttempts;
  }

  recordAttempt(strategy: string): void {
    this.resetIfNeeded();
    const attempts = this.attemptCounts.get(strategy) || 0;
    this.attemptCounts.set(strategy, attempts + 1);
  }

  reset(): void {
    this.attemptCounts.clear();
    this.lastResetTime = Date.now();
  }

  private resetIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastResetTime > this.resetTimeMs) {
      this.reset();
    }
  }

  getAttemptCount(strategy: string): number {
    this.resetIfNeeded();
    return this.attemptCounts.get(strategy) || 0;
  }
}
