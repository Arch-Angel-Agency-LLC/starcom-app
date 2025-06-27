/**
 * Rate Limiting and Resource Protection Utilities
 * Prevents resource exhaustion and DoS attacks
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  blockDuration?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked?: boolean;
  blockExpiresAt?: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockExpiresAt?: number;
  requests: RequestLogEntry[];
}

interface RequestLogEntry {
  timestamp: number;
  success: boolean;
  endpoint?: string;
}

class RateLimiter {
  private static instance: RateLimiter;
  private requestMap = new Map<string, RequestRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Default configurations for different endpoint types
  private readonly DEFAULT_CONFIGS = {
    // Authentication endpoints - very strict
    auth: { maxRequests: 5, windowMs: 15 * 60 * 1000, blockDuration: 30 * 60 * 1000 }, // 5 per 15min, block 30min
    
    // API endpoints - moderate limits
    api: { maxRequests: 100, windowMs: 60 * 1000, blockDuration: 5 * 60 * 1000 }, // 100 per minute, block 5min
    
    // File uploads - restrictive
    upload: { maxRequests: 10, windowMs: 60 * 1000, blockDuration: 10 * 60 * 1000 }, // 10 per minute, block 10min
    
    // WebSocket connections - very restrictive
    websocket: { maxRequests: 3, windowMs: 60 * 1000, blockDuration: 15 * 60 * 1000 }, // 3 per minute, block 15min
    
    // General requests
    general: { maxRequests: 200, windowMs: 60 * 1000, blockDuration: 2 * 60 * 1000 } // 200 per minute, block 2min
  } as const;

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
      RateLimiter.instance.startCleanup();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if a request should be rate limited
   */
  checkRateLimit(
    identifier: string, 
    config: RateLimitConfig | keyof typeof RateLimiter.prototype.DEFAULT_CONFIGS = 'general'
  ): RateLimitResult {
    const rateLimitConfig = typeof config === 'string' ? this.DEFAULT_CONFIGS[config] : config;
    const now = Date.now();
    
    // Get or create request record
    let record = this.requestMap.get(identifier);
    
    if (!record) {
      record = {
        count: 0,
        resetTime: now + rateLimitConfig.windowMs,
        requests: []
      };
      this.requestMap.set(identifier, record);
    }

    // Check if currently blocked
    if (record.blocked && record.blockExpiresAt && now < record.blockExpiresAt) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        blocked: true,
        blockExpiresAt: record.blockExpiresAt
      };
    }

    // Reset window if expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + rateLimitConfig.windowMs;
      record.blocked = false;
      record.blockExpiresAt = undefined;
      record.requests = [];
    }

    // Check if limit exceeded
    if (record.count >= rateLimitConfig.maxRequests) {
      // Apply block if configured
      if (rateLimitConfig.blockDuration) {
        record.blocked = true;
        record.blockExpiresAt = now + rateLimitConfig.blockDuration;
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        blocked: record.blocked,
        blockExpiresAt: record.blockExpiresAt
      };
    }

    return {
      allowed: true,
      remaining: rateLimitConfig.maxRequests - record.count - 1,
      resetTime: record.resetTime
    };
  }

  /**
   * Record a request (call after making the request)
   */
  recordRequest(
    identifier: string,
    success: boolean,
    endpoint?: string,
    config: RateLimitConfig | keyof typeof RateLimiter.prototype.DEFAULT_CONFIGS = 'general'
  ): void {
    const rateLimitConfig = typeof config === 'string' ? this.DEFAULT_CONFIGS[config] : config;
    
    const record = this.requestMap.get(identifier);
    if (!record) return;

    // Skip recording based on configuration (only for custom configs)
    if (typeof config !== 'string' && 'skipSuccessfulRequests' in rateLimitConfig) {
      if (rateLimitConfig.skipSuccessfulRequests && success) return;
      if (rateLimitConfig.skipFailedRequests && !success) return;
    }

    record.count++;
    record.requests.push({
      timestamp: Date.now(),
      success,
      endpoint
    });

    // Limit request history size
    if (record.requests.length > 100) {
      record.requests = record.requests.slice(-50);
    }
  }

  getStatus(identifier: string): RateLimitResult | null {
    const record = this.requestMap.get(identifier);
    if (!record) return null;

    return {
      allowed: record.count < 100, // Default limit for status check
      remaining: Math.max(0, 100 - record.count),
      resetTime: record.resetTime,
      blocked: record.blocked,
      blockExpiresAt: record.blockExpiresAt
    };
  }

  /**
   * Manually block an identifier (for security violations)
   */
  blockIdentifier(identifier: string, durationMs: number, reason?: string): void {
    const now = Date.now();
    const record = this.requestMap.get(identifier) || {
      count: 999,
      resetTime: now + durationMs,
      requests: []
    };

    record.blocked = true;
    record.blockExpiresAt = now + durationMs;
    
    if (reason) {
      record.requests.push({
        timestamp: now,
        success: false,
        endpoint: `BLOCKED: ${reason}`
      });
    }

    this.requestMap.set(identifier, record);
  }

  /**
   * Unblock an identifier
   */
  unblockIdentifier(identifier: string): void {
    const record = this.requestMap.get(identifier);
    if (record) {
      record.blocked = false;
      record.blockExpiresAt = undefined;
    }
  }

  /**
   * Clear all rate limit data for an identifier
   */
  clearIdentifier(identifier: string): void {
    this.requestMap.delete(identifier);
  }

  /**
   * Get analytics data
   */
  getAnalytics(): {
    totalIdentifiers: number;
    blockedIdentifiers: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    recentBlocks: Array<{ identifier: string; blockExpiresAt: number; reason?: string }>;
  } {
    const now = Date.now();
    const endpointCounts = new Map<string, number>();
    const recentBlocks: Array<{ identifier: string; blockExpiresAt: number; reason?: string }> = [];
    let blockedCount = 0;

    for (const [identifier, record] of this.requestMap.entries()) {
      // Count blocked identifiers
      if (record.blocked && record.blockExpiresAt && now < record.blockExpiresAt) {
        blockedCount++;
        
        // Find block reason from requests
        const blockReason = record.requests
          .find(req => req.endpoint?.startsWith('BLOCKED:'))
          ?.endpoint?.replace('BLOCKED: ', '');
        
        recentBlocks.push({
          identifier: identifier.length > 20 ? identifier.substring(0, 20) + '...' : identifier,
          blockExpiresAt: record.blockExpiresAt,
          reason: blockReason
        });
      }

      // Count endpoint usage
      for (const request of record.requests) {
        if (request.endpoint && !request.endpoint.startsWith('BLOCKED:')) {
          endpointCounts.set(request.endpoint, (endpointCounts.get(request.endpoint) || 0) + 1);
        }
      }
    }

    // Get top endpoints
    const topEndpoints = Array.from(endpointCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      totalIdentifiers: this.requestMap.size,
      blockedIdentifiers: blockedCount,
      topEndpoints,
      recentBlocks: recentBlocks.slice(0, 20)
    };
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [identifier, record] of this.requestMap.entries()) {
      // Remove expired records that are not blocked
      if (now > record.resetTime + (60 * 60 * 1000) && !record.blocked) { // 1 hour grace period
        toDelete.push(identifier);
      }
      // Remove expired blocks
      else if (record.blocked && record.blockExpiresAt && now > record.blockExpiresAt + (24 * 60 * 60 * 1000)) { // 24 hour grace period
        toDelete.push(identifier);
      }
    }

    for (const identifier of toDelete) {
      this.requestMap.delete(identifier);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clean up every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  /**
   * Stop cleanup (for testing or shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Resource monitoring utilities
export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private memoryUsage: number[] = [];
  private cpuUsage: number[] = [];
  private networkConnections = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.recordMetrics();
    }, 30000); // Every 30 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private recordMetrics(): void {
    // Memory usage (if available in browser environment)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memInfo = (performance as unknown as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      this.memoryUsage.push(usagePercent);
    }

    // Keep only last 100 readings
    if (this.memoryUsage.length > 100) {
      this.memoryUsage = this.memoryUsage.slice(-50);
    }
    if (this.cpuUsage.length > 100) {
      this.cpuUsage = this.cpuUsage.slice(-50);
    }
  }

  getResourceStatus(): {
    memoryUsagePercent: number;
    averageMemoryUsage: number;
    networkConnections: number;
    isUnderStress: boolean;
  } {
    const currentMemory = this.memoryUsage[this.memoryUsage.length - 1] || 0;
    const avgMemory = this.memoryUsage.length > 0 
      ? this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length 
      : 0;

    return {
      memoryUsagePercent: currentMemory,
      averageMemoryUsage: avgMemory,
      networkConnections: this.networkConnections,
      isUnderStress: currentMemory > 80 || this.networkConnections > 50
    };
  }

  recordConnection(): void {
    this.networkConnections++;
  }

  recordDisconnection(): void {
    this.networkConnections = Math.max(0, this.networkConnections - 1);
  }
}

// Export singleton instances
export const rateLimiter = RateLimiter.getInstance();
export const resourceMonitor = ResourceMonitor.getInstance();

// Start monitoring by default
resourceMonitor.startMonitoring();
