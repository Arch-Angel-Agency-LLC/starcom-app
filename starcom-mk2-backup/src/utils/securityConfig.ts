/**
 * Security Configuration and Policy Management
 * Centralized security settings and policy enforcement
 */

export interface SecurityPolicy {
  authentication: {
    maxLoginAttempts: number;
    lockoutDurationMs: number;
    sessionTimeoutMs: number;
    requireMFA: boolean;
    passwordMinLength: number;
  };
  apiSecurity: {
    rateLimitRequests: number;
    rateLimitWindowMs: number;
    requestTimeoutMs: number;
    maxPayloadSize: number;
    allowedOrigins: string[];
  };
  dataSecurity: {
    encryptSensitiveData: boolean;
    logRetentionDays: number;
    auditLogLevel: 'minimal' | 'standard' | 'comprehensive';
    dataClassifications: string[];
  };
  networkSecurity: {
    enforceHttps: boolean;
    allowInsecureConnections: boolean;
    maxConcurrentConnections: number;
    connectionTimeoutMs: number;
  };
  contentSecurity: {
    enableCSP: boolean;
    allowInlineScripts: boolean;
    allowEval: boolean;
    trustedDomains: string[];
  };
}

export interface SecurityContext {
  environment: 'development' | 'staging' | 'production';
  userRole: 'admin' | 'analyst' | 'viewer' | 'guest';
  clearanceLevel: 'public' | 'confidential' | 'secret' | 'top_secret';
  sessionId?: string;
  userId?: string;
}

class SecurityConfigManager {
  private static instance: SecurityConfigManager;
  private currentPolicy: SecurityPolicy;
  private context: SecurityContext;

  // Default security policies
  private readonly DEFAULT_POLICIES: Record<SecurityContext['environment'], SecurityPolicy> = {
    development: {
      authentication: {
        maxLoginAttempts: 10,
        lockoutDurationMs: 5 * 60 * 1000, // 5 minutes
        sessionTimeoutMs: 8 * 60 * 60 * 1000, // 8 hours
        requireMFA: false,
        passwordMinLength: 8
      },
      apiSecurity: {
        rateLimitRequests: 200,
        rateLimitWindowMs: 60 * 1000, // 1 minute
        requestTimeoutMs: 30 * 1000, // 30 seconds
        maxPayloadSize: 10 * 1024 * 1024, // 10MB
        allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000']
      },
      dataSecurity: {
        encryptSensitiveData: true,
        logRetentionDays: 30,
        auditLogLevel: 'comprehensive',
        dataClassifications: ['public', 'confidential', 'secret', 'top_secret']
      },
      networkSecurity: {
        enforceHttps: false,
        allowInsecureConnections: true,
        maxConcurrentConnections: 100,
        connectionTimeoutMs: 30 * 1000
      },
      contentSecurity: {
        enableCSP: true,
        allowInlineScripts: false,
        allowEval: false,
        trustedDomains: ['localhost', '127.0.0.1']
      }
    },
    staging: {
      authentication: {
        maxLoginAttempts: 5,
        lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
        sessionTimeoutMs: 4 * 60 * 60 * 1000, // 4 hours
        requireMFA: true,
        passwordMinLength: 12
      },
      apiSecurity: {
        rateLimitRequests: 100,
        rateLimitWindowMs: 60 * 1000,
        requestTimeoutMs: 15 * 1000,
        maxPayloadSize: 5 * 1024 * 1024, // 5MB
        allowedOrigins: ['https://staging.example.com']
      },
      dataSecurity: {
        encryptSensitiveData: true,
        logRetentionDays: 90,
        auditLogLevel: 'comprehensive',
        dataClassifications: ['public', 'confidential', 'secret', 'top_secret']
      },
      networkSecurity: {
        enforceHttps: true,
        allowInsecureConnections: false,
        maxConcurrentConnections: 50,
        connectionTimeoutMs: 15 * 1000
      },
      contentSecurity: {
        enableCSP: true,
        allowInlineScripts: false,
        allowEval: false,
        trustedDomains: ['staging.example.com']
      }
    },
    production: {
      authentication: {
        maxLoginAttempts: 3,
        lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
        sessionTimeoutMs: 2 * 60 * 60 * 1000, // 2 hours
        requireMFA: true,
        passwordMinLength: 16
      },
      apiSecurity: {
        rateLimitRequests: 50,
        rateLimitWindowMs: 60 * 1000,
        requestTimeoutMs: 10 * 1000,
        maxPayloadSize: 2 * 1024 * 1024, // 2MB
        allowedOrigins: ['https://app.example.com']
      },
      dataSecurity: {
        encryptSensitiveData: true,
        logRetentionDays: 365,
        auditLogLevel: 'comprehensive',
        dataClassifications: ['public', 'confidential', 'secret', 'top_secret']
      },
      networkSecurity: {
        enforceHttps: true,
        allowInsecureConnections: false,
        maxConcurrentConnections: 25,
        connectionTimeoutMs: 10 * 1000
      },
      contentSecurity: {
        enableCSP: true,
        allowInlineScripts: false,
        allowEval: false,
        trustedDomains: ['app.example.com']
      }
    }
  };

  static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager();
    }
    return SecurityConfigManager.instance;
  }

  constructor() {
    // Initialize with default context
    this.context = {
      environment: this.detectEnvironment(),
      userRole: 'guest',
      clearanceLevel: 'public'
    };
    
    this.currentPolicy = this.DEFAULT_POLICIES[this.context.environment];
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): SecurityContext['environment'] {
    if (typeof window === 'undefined') return 'production'; // SSR environment
    
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
      return 'development';
    } else if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  /**
   * Update security context
   */
  updateContext(updates: Partial<SecurityContext>): void {
    this.context = { ...this.context, ...updates };
    
    // Update policy if environment changed
    if (updates.environment) {
      this.currentPolicy = this.DEFAULT_POLICIES[updates.environment];
    }
  }

  /**
   * Get current security policy
   */
  getPolicy(): SecurityPolicy {
    return { ...this.currentPolicy };
  }

  /**
   * Get current security context
   */
  getContext(): SecurityContext {
    return { ...this.context };
  }

  /**
   * Check if an action is allowed based on current security policy
   */
  isAllowed(action: string): boolean {
    const { userRole, clearanceLevel } = this.context;

    // Role-based access control
    switch (action) {
      case 'create_investigation':
        return ['admin', 'analyst'].includes(userRole);
      
      case 'delete_investigation':
        return userRole === 'admin';
      
      case 'view_classified_data':
        return ['secret', 'top_secret'].includes(clearanceLevel);
      
      case 'modify_system_settings':
        return userRole === 'admin';
      
      case 'access_audit_logs':
        return ['admin', 'analyst'].includes(userRole);
      
      default:
        return true; // Allow by default for non-restricted actions
    }
  }

  /**
   * Get Content Security Policy header value
   */
  getCSPHeader(): string {
    const policy = this.currentPolicy.contentSecurity;
    
    if (!policy.enableCSP) return '';

    const directives = [
      "default-src 'self'",
      `connect-src 'self' ${policy.trustedDomains.map(d => `https://${d}`).join(' ')}`,
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "style-src 'self' 'unsafe-inline'", // Allow inline styles for React
    ];

    if (policy.allowInlineScripts) {
      directives.push("script-src 'self' 'unsafe-inline'");
    } else {
      directives.push("script-src 'self'");
    }

    if (!policy.allowEval) {
      directives.push("script-src 'self' 'unsafe-eval'");
    }

    return directives.join('; ');
  }

  /**
   * Validate request against security policy
   */
  validateRequest(request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    payload?: unknown;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.currentPolicy;

    // Check HTTPS enforcement
    if (policy.networkSecurity.enforceHttps && !request.url.startsWith('https://')) {
      errors.push('HTTPS is required for this environment');
    }

    // Check allowed origins
    const origin = request.headers['origin'] || request.headers['Origin'];
    if (origin && !policy.apiSecurity.allowedOrigins.includes(origin)) {
      errors.push(`Origin ${origin} is not in allowed origins list`);
    }

    // Check payload size
    if (request.payload) {
      const payloadSize = JSON.stringify(request.payload).length;
      if (payloadSize > policy.apiSecurity.maxPayloadSize) {
        errors.push(`Payload size ${payloadSize} exceeds maximum ${policy.apiSecurity.maxPayloadSize}`);
      }
    }

    // Check required headers
    if (!request.headers['x-requested-with']) {
      errors.push('Missing X-Requested-With header');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get security headers for responses
   */
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), camera=(), microphone=()'
    };

    // Add CSP header
    const csp = this.getCSPHeader();
    if (csp) {
      headers['Content-Security-Policy'] = csp;
    }

    // Add HSTS header for production
    if (this.context.environment === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    return headers;
  }

  /**
   * Generate security event for monitoring
   */
  generateSecurityEvent(eventType: string, details: Record<string, unknown>): {
    timestamp: string;
    eventType: string;
    context: SecurityContext;
    details: Record<string, unknown>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    // Determine severity based on event type
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (eventType.includes('auth_failure') || eventType.includes('unauthorized')) {
      severity = 'high';
    } else if (eventType.includes('rate_limit') || eventType.includes('validation_error')) {
      severity = 'medium';
    } else if (eventType.includes('injection') || eventType.includes('breach')) {
      severity = 'critical';
    }

    return {
      timestamp: new Date().toISOString(),
      eventType,
      context: this.getContext(),
      details,
      severity
    };
  }
}

// Export singleton instance
export const securityConfig = SecurityConfigManager.getInstance();
export default securityConfig;

// Security utility functions
export const SecurityUtils = {
  /**
   * Generate a secure random string
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  },

  /**
   * Hash sensitive data for logging/storage
   */
  hashSensitiveData(data: string): string {
    // Simple hash for frontend use (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  },

  /**
   * Sanitize URL for logging
   */
  sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove query parameters and fragments
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return '[INVALID_URL]';
    }
  },

  /**
   * Check if data contains sensitive information
   */
  containsSensitiveData(data: unknown): boolean {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /private.*key/i,
      /api.*key/i,
      /credential/i,
      /auth/i,
      /session/i,
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    ];

    return sensitivePatterns.some(pattern => pattern.test(data as string));
  }
};
