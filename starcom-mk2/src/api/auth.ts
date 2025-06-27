// src/api/auth.ts
// Hardened authentication API client with comprehensive security controls

import { secureLogger } from '../utils/secureLogging';

export interface BackendSession {
  token: string;
  expiresAt: number;
  refreshToken?: string;
  sessionId: string;
}

export interface AuthError {
  code: string;
  message: string;
  attempts?: number;
  lockoutUntil?: number;
}

// Secure configuration
const BACKEND_API_BASE = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8081/api/v1';
const MAX_AUTH_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Rate limiting and attempt tracking
const authAttempts = new Map<string, { count: number; lastAttempt: number; lockoutUntil?: number }>();

class SecureAuthClient {
  private static instance: SecureAuthClient;
  private currentSession: BackendSession | null = null;
  private csrfToken: string | null = null;

  static getInstance(): SecureAuthClient {
    if (!SecureAuthClient.instance) {
      SecureAuthClient.instance = new SecureAuthClient();
    }
    return SecureAuthClient.instance;
  }

  // Input validation for addresses
  private validateAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // Basic Ethereum address validation (adjust for other chains)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  // Input validation for signatures
  private validateSignature(signature: string): boolean {
    if (!signature || typeof signature !== 'string') {
      return false;
    }
    
    // Basic signature validation (adjust for your signature format)
    const signatureRegex = /^0x[a-fA-F0-9]{130}$/;
    return signatureRegex.test(signature);
  }

  // Rate limiting check
  private checkRateLimit(identifier: string): { allowed: boolean; error?: AuthError } {
    const now = Date.now();
    const attempts = authAttempts.get(identifier);

    if (attempts?.lockoutUntil && now < attempts.lockoutUntil) {
      return {
        allowed: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please try again later.',
          lockoutUntil: attempts.lockoutUntil
        }
      };
    }

    if (attempts && attempts.count >= MAX_AUTH_ATTEMPTS) {
      const lockoutUntil = now + LOCKOUT_DURATION;
      authAttempts.set(identifier, { ...attempts, lockoutUntil });
      return {
        allowed: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Maximum authentication attempts exceeded. Account temporarily locked.',
          lockoutUntil
        }
      };
    }

    return { allowed: true };
  }

  // Record authentication attempt
  private recordAttempt(identifier: string, success: boolean): void {
    if (success) {
      authAttempts.delete(identifier);
      return;
    }

    const now = Date.now();
    const existing = authAttempts.get(identifier);
    authAttempts.set(identifier, {
      count: (existing?.count || 0) + 1,
      lastAttempt: now
    });
  }

  // Secure HTTP request helper
  private async makeSecureRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const headers = new Headers(options.headers);
      
      // Add security headers
      headers.set('Content-Type', 'application/json');
      headers.set('X-Requested-With', 'XMLHttpRequest');
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // Add CSRF token if available
      if (this.csrfToken) {
        headers.set('X-CSRF-Token', this.csrfToken);
      }

      const response = await fetch(endpoint, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'same-origin', // Prevent CSRF
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Authentication request timed out');
      }
      throw error;
    }
  }

  // Get CSRF token
  async initializeCSRF(): Promise<void> {
    try {
      const response = await this.makeSecureRequest(`${BACKEND_API_BASE}/auth/csrf`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
      }
    } catch (error) {
      secureLogger.warn('Failed to initialize CSRF token', error, {
        component: 'SecureAuthClient'
      });
    }
  }

  async requestBackendNonce(address: string): Promise<string> {
    // Input validation
    if (!this.validateAddress(address)) {
      secureLogger.audit('SecureAuthClient', 'requestNonce', 'FAILURE', 
        { error: 'Invalid address format' }, 'CONFIDENTIAL');
      throw new Error('Invalid address format');
    }

    // Rate limiting
    const rateLimitCheck = this.checkRateLimit(address);
    if (!rateLimitCheck.allowed) {
      secureLogger.audit('SecureAuthClient', 'requestNonce', 'FAILURE',
        { error: 'Rate limit exceeded', address: address.substring(0, 6) + '...' }, 'CONFIDENTIAL');
      throw rateLimitCheck.error;
    }

    try {
      const response = await this.makeSecureRequest(`${BACKEND_API_BASE}/auth/nonce`, {
        method: 'POST',
        body: JSON.stringify({ address: address.toLowerCase() }), // Normalize address
      });

      if (!response.ok) {
        this.recordAttempt(address, false);
        
        let errorMessage = 'Failed to fetch nonce from backend';
        if (response.status === 429) {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (response.status >= 500) {
          errorMessage = 'Authentication service temporarily unavailable';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate nonce format
      if (!data.nonce || typeof data.nonce !== 'string' || data.nonce.length < 32) {
        throw new Error('Invalid nonce received from server');
      }

      this.recordAttempt(address, true);
      
      secureLogger.audit('SecureAuthClient', 'requestNonce', 'SUCCESS',
        { address: address.substring(0, 6) + '...' }, 'CONFIDENTIAL');

      return data.nonce;
    } catch (error) {
      this.recordAttempt(address, false);
      
      secureLogger.error('Nonce request failed', error, {
        component: 'SecureAuthClient'
      });
      
      throw error;
    }
  }

  async submitBackendSignature(address: string, signature: string): Promise<BackendSession> {
    // Input validation
    if (!this.validateAddress(address)) {
      throw new Error('Invalid address format');
    }
    
    if (!this.validateSignature(signature)) {
      throw new Error('Invalid signature format');
    }

    // Rate limiting
    const rateLimitCheck = this.checkRateLimit(address);
    if (!rateLimitCheck.allowed) {
      throw rateLimitCheck.error;
    }

    try {
      const response = await this.makeSecureRequest(`${BACKEND_API_BASE}/auth/verify`, {
        method: 'POST',
        body: JSON.stringify({ 
          address: address.toLowerCase(),
          signature
        }),
      });

      if (!response.ok) {
        this.recordAttempt(address, false);
        
        let errorMessage = 'Failed to verify signature with backend';
        if (response.status === 401) {
          errorMessage = 'Invalid signature provided';
        } else if (response.status === 429) {
          errorMessage = 'Too many authentication attempts';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate session data
      if (!data.token || !data.expiresAt || !data.sessionId) {
        throw new Error('Invalid session data received from server');
      }

      // Create secure session
      const session: BackendSession = {
        token: data.token,
        expiresAt: data.expiresAt,
        refreshToken: data.refreshToken,
        sessionId: data.sessionId
      };

      this.currentSession = session;
      this.recordAttempt(address, true);
      
      secureLogger.audit('SecureAuthClient', 'authenticate', 'SUCCESS',
        { sessionId: session.sessionId, address: address.substring(0, 6) + '...' }, 'CONFIDENTIAL');

      return session;
    } catch (error) {
      this.recordAttempt(address, false);
      
      secureLogger.error('Authentication failed', error, {
        component: 'SecureAuthClient'
      });
      
      throw error;
    }
  }

  // Session management
  getCurrentSession(): BackendSession | null {
    if (this.currentSession && Date.now() > this.currentSession.expiresAt) {
      this.clearSession();
      return null;
    }
    return this.currentSession;
  }

  clearSession(): void {
    if (this.currentSession) {
      secureLogger.audit('SecureAuthClient', 'logout', 'SUCCESS',
        { sessionId: this.currentSession.sessionId }, 'CONFIDENTIAL');
    }
    this.currentSession = null;
  }

  // Token refresh
  async refreshSession(): Promise<BackendSession | null> {
    if (!this.currentSession?.refreshToken) {
      return null;
    }

    try {
      const response = await this.makeSecureRequest(`${BACKEND_API_BASE}/auth/refresh`, {
        method: 'POST',
        body: JSON.stringify({ 
          refreshToken: this.currentSession.refreshToken,
          sessionId: this.currentSession.sessionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSession = {
          ...this.currentSession,
          token: data.token,
          expiresAt: data.expiresAt
        };
        return this.currentSession;
      }
    } catch (error) {
      secureLogger.error('Session refresh failed', error, {
        component: 'SecureAuthClient'
      });
    }

    this.clearSession();
    return null;
  }
}

// Export singleton instance and legacy functions for compatibility
const authClient = SecureAuthClient.getInstance();

export async function requestBackendNonce(address: string): Promise<string> {
  await authClient.initializeCSRF();
  return authClient.requestBackendNonce(address);
}

export async function submitBackendSignature(address: string, signature: string): Promise<BackendSession> {
  return authClient.submitBackendSignature(address, signature);
}

export { authClient as secureAuthClient };
