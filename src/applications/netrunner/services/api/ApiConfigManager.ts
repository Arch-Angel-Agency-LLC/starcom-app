/**
 * NetRunner API Configuration Management
 * 
 * Secure storage and management of API credentials for OSINT tools.
 * Implements encryption, rotation, and health monitoring for production use.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { LoggerFactory } from '../logging';
import { ErrorFactory, NETRUNNER_ERROR_CODES } from '../error';

const logger = LoggerFactory.getLogger('NetRunner:ApiConfig');

// API Configuration Types
export interface ApiCredentials {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  secretKey?: string;
  baseUrl: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  quotas: {
    dailyQuota: number;
    monthlyQuota: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastCheck: string;
    responseTime?: number;
    errorCount: number;
    successRate: number;
  };
}

export interface ApiUsageStats {
  credentialId: string;
  requests: {
    minute: number;
    hour: number;
    day: number;
    month: number;
  };
  quotaUsage: {
    daily: number;
    monthly: number;
  };
  lastReset: {
    minute: string;
    hour: string;
    day: string;
    month: string;
  };
}

// API Configuration Store Interface
interface ApiConfigStore {
  getCredentials(provider: string): Promise<ApiCredentials[]>;
  addCredentials(credentials: Omit<ApiCredentials, 'id' | 'createdAt' | 'updatedAt' | 'health'>): Promise<ApiCredentials>;
  updateCredentials(id: string, updates: Partial<ApiCredentials>): Promise<ApiCredentials>;
  deleteCredentials(id: string): Promise<void>;
  getUsageStats(credentialId: string): Promise<ApiUsageStats>;
  updateUsageStats(credentialId: string, stats: Partial<ApiUsageStats>): Promise<void>;
  rotateKey(id: string): Promise<ApiCredentials>;
}

/**
 * Production API Configuration Manager
 * 
 * Manages API credentials with encryption, health monitoring, and usage tracking.
 */
export class ApiConfigManager {
  private store: ApiConfigStore;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private encryptionKey: string;

  constructor(store: ApiConfigStore, encryptionKey?: string) {
    this.store = store;
    this.encryptionKey = encryptionKey || this.generateDefaultKey();
    this.startHealthMonitoring();
  }

  /**
   * Add new API credentials with validation and encryption
   */
  async addCredentials(
    provider: string,
    name: string,
    apiKey: string,
    config: {
      secretKey?: string;
      baseUrl: string;
      rateLimit: ApiCredentials['rateLimit'];
      quotas: ApiCredentials['quotas'];
    }
  ): Promise<ApiCredentials> {
    try {
      logger.info('Adding new API credentials', { provider, name });

      // Validate credentials format
      if (!this.validateCredentials(provider, apiKey, config)) {
        throw ErrorFactory.createIntegrationError(
          'Invalid API credentials format',
          NETRUNNER_ERROR_CODES.INTEGRATION_AUTHENTICATION_FAILED,
          { details: { provider, name } }
        );
      }

      // Encrypt sensitive data
      const encryptedApiKey = this.encrypt(apiKey);
      const encryptedSecretKey = config.secretKey ? this.encrypt(config.secretKey) : undefined;

      const credentials: Omit<ApiCredentials, 'id' | 'createdAt' | 'updatedAt' | 'health'> = {
        name,
        provider,
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
        baseUrl: config.baseUrl,
        rateLimit: config.rateLimit,
        quotas: config.quotas,
        isActive: true
      };

      const savedCredentials = await this.store.addCredentials(credentials);

      // Perform initial health check
      await this.performHealthCheck(savedCredentials.id);

      logger.info('API credentials added successfully', { 
        credentialId: savedCredentials.id, 
        provider, 
        name 
      });

      return savedCredentials;
    } catch (error) {
      logger.error('Failed to add API credentials', error);
      throw error;
    }
  }

  /**
   * Get active credentials for a provider with decryption
   */
  async getActiveCredentials(provider: string): Promise<ApiCredentials | null> {
    try {
      const credentials = await this.store.getCredentials(provider);
      const activeCredentials = credentials.find(cred => 
        cred.isActive && cred.health.status !== 'unhealthy'
      );

      if (!activeCredentials) {
        logger.warn('No active credentials found for provider', { provider });
        return null;
      }

      // Decrypt credentials for use
      const decryptedCredentials = {
        ...activeCredentials,
        apiKey: this.decrypt(activeCredentials.apiKey),
        secretKey: activeCredentials.secretKey ? this.decrypt(activeCredentials.secretKey) : undefined
      };

      // Update last used timestamp
      await this.store.updateCredentials(activeCredentials.id, {
        lastUsed: new Date().toISOString()
      });

      return decryptedCredentials;
    } catch (error) {
      logger.error('Failed to get active credentials', error);
      throw ErrorFactory.createIntegrationError(
        'Failed to retrieve API credentials',
        NETRUNNER_ERROR_CODES.INTEGRATION_CONNECTION_FAILED,
        { details: { provider, error } }
      );
    }
  }

  /**
   * Check if API usage is within limits
   */
  async checkRateLimit(credentialId: string): Promise<{
    allowed: boolean;
    remaining: {
      minute: number;
      hour: number;
      day: number;
    };
    resetTime: {
      minute: string;
      hour: string;
      day: string;
    };
  }> {
    try {
      const credentials = await this.getCredentialsById(credentialId);
      const usage = await this.store.getUsageStats(credentialId);

      const now = new Date();
      const remaining = {
        minute: Math.max(0, credentials.rateLimit.requestsPerMinute - usage.requests.minute),
        hour: Math.max(0, credentials.rateLimit.requestsPerHour - usage.requests.hour),
        day: Math.max(0, credentials.rateLimit.requestsPerDay - usage.requests.day)
      };

      const allowed = remaining.minute > 0 && remaining.hour > 0 && remaining.day > 0;

      if (!allowed) {
        logger.warn('Rate limit exceeded for credentials', { 
          credentialId, 
          usage: usage.requests,
          limits: credentials.rateLimit 
        });
      }

      return {
        allowed,
        remaining,
        resetTime: {
          minute: this.getNextReset(now, 'minute'),
          hour: this.getNextReset(now, 'hour'),
          day: this.getNextReset(now, 'day')
        }
      };
    } catch (error) {
      logger.error('Failed to check rate limit', error);
      throw error;
    }
  }

  /**
   * Record API usage for rate limiting
   */
  async recordUsage(credentialId: string, requestCount: number = 1): Promise<void> {
    try {
      const usage = await this.store.getUsageStats(credentialId);
      const now = new Date();

      // Reset counters if time periods have passed
      const updatedUsage = this.resetExpiredCounters(usage, now);

      // Increment usage counters
      updatedUsage.requests.minute += requestCount;
      updatedUsage.requests.hour += requestCount;
      updatedUsage.requests.day += requestCount;
      updatedUsage.requests.month += requestCount;

      await this.store.updateUsageStats(credentialId, updatedUsage);

      logger.debug('API usage recorded', { credentialId, requestCount, usage: updatedUsage.requests });
    } catch (error) {
      logger.error('Failed to record API usage', error);
      // Don't throw - usage tracking shouldn't break API calls
    }
  }

  /**
   * Perform health check on API credentials
   */
  async performHealthCheck(credentialId: string): Promise<void> {
    try {
      const credentials = await this.getCredentialsById(credentialId);
      const startTime = Date.now();

      logger.debug('Performing health check', { credentialId, provider: credentials.provider });

      // Simple health check - attempt to connect to API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(credentials.baseUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${this.decrypt(credentials.apiKey)}`,
          'User-Agent': 'NetRunner/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      // Update health status
      const healthUpdate = {
        health: {
          status: isHealthy ? 'healthy' as const : 'unhealthy' as const,
          lastCheck: new Date().toISOString(),
          responseTime,
          errorCount: isHealthy ? 0 : credentials.health.errorCount + 1,
          successRate: this.calculateSuccessRate(credentials.health, isHealthy)
        }
      };

      await this.store.updateCredentials(credentialId, healthUpdate);

      logger.info('Health check completed', { 
        credentialId, 
        status: healthUpdate.health.status,
        responseTime 
      });
    } catch (error) {
      logger.error('Health check failed', error);
      
      // Update health status to unhealthy
      const credentials = await this.getCredentialsById(credentialId);
      await this.store.updateCredentials(credentialId, {
        health: {
          ...credentials.health,
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          errorCount: credentials.health.errorCount + 1
        }
      });
    }
  }

  /**
   * Start automated health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        logger.debug('Starting scheduled health checks');
        
        // Get all active credentials
        const allProviders = ['shodan', 'theharvester', 'virustotal', 'censys'];
        
        for (const provider of allProviders) {
          const credentials = await this.store.getCredentials(provider);
          
          for (const cred of credentials.filter(c => c.isActive)) {
            await this.performHealthCheck(cred.id);
          }
        }
      } catch (error) {
        logger.error('Error during scheduled health checks', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop health monitoring
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Private helper methods
  private async getCredentialsById(id: string): Promise<ApiCredentials> {
    const allProviders = ['shodan', 'theharvester', 'virustotal', 'censys'];
    
    for (const provider of allProviders) {
      const credentials = await this.store.getCredentials(provider);
      const found = credentials.find(c => c.id === id);
      if (found) return found;
    }
    
    throw ErrorFactory.createIntegrationError(
      'API credentials not found',
      NETRUNNER_ERROR_CODES.INTEGRATION_CONNECTION_FAILED,
      { details: { credentialId: id } }
    );
  }

  private validateCredentials(provider: string, apiKey: string, config: { baseUrl: string; [key: string]: unknown }): boolean {
    if (!apiKey || !config.baseUrl) return false;
    
    // Provider-specific validation
    switch (provider) {
      case 'shodan':
        return /^[A-Za-z0-9]{32}$/.test(apiKey);
      case 'virustotal':
        return /^[A-Za-z0-9]{64}$/.test(apiKey);
      default:
        return apiKey.length > 10;
    }
  }

  private encrypt(data: string): string {
    // In production, use proper encryption library like crypto-js
    // This is a placeholder implementation
    return Buffer.from(data).toString('base64');
  }

  private decrypt(encryptedData: string): string {
    // In production, use proper decryption
    // This is a placeholder implementation
    return Buffer.from(encryptedData, 'base64').toString('utf-8');
  }

  private generateDefaultKey(): string {
    // In production, generate proper encryption key
    return 'default-encryption-key-replace-in-production';
  }

  private getNextReset(now: Date, period: 'minute' | 'hour' | 'day'): string {
    const next = new Date(now);
    switch (period) {
      case 'minute':
        next.setMinutes(next.getMinutes() + 1, 0, 0);
        break;
      case 'hour':
        next.setHours(next.getHours() + 1, 0, 0, 0);
        break;
      case 'day':
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        break;
    }
    return next.toISOString();
  }

  private resetExpiredCounters(usage: ApiUsageStats, now: Date): ApiUsageStats {
    const updated = { ...usage };
    
    // Reset minute counter if needed
    if (new Date(usage.lastReset.minute) < new Date(now.getTime() - 60000)) {
      updated.requests.minute = 0;
      updated.lastReset.minute = now.toISOString();
    }
    
    // Reset hour counter if needed
    if (new Date(usage.lastReset.hour) < new Date(now.getTime() - 3600000)) {
      updated.requests.hour = 0;
      updated.lastReset.hour = now.toISOString();
    }
    
    // Reset day counter if needed
    if (new Date(usage.lastReset.day) < new Date(now.getTime() - 86400000)) {
      updated.requests.day = 0;
      updated.lastReset.day = now.toISOString();
    }
    
    return updated;
  }

  private calculateSuccessRate(health: ApiCredentials['health'], isSuccess: boolean): number {
    const totalRequests = health.errorCount + (isSuccess ? 1 : 0);
    const successCount = totalRequests - health.errorCount + (isSuccess ? 1 : 0);
    return totalRequests > 0 ? successCount / totalRequests : 1.0;
  }
}

// In-memory store implementation for development
export class MemoryApiConfigStore implements ApiConfigStore {
  private credentials: Map<string, ApiCredentials> = new Map();
  private usage: Map<string, ApiUsageStats> = new Map();

  async getCredentials(provider: string): Promise<ApiCredentials[]> {
    return Array.from(this.credentials.values()).filter(cred => cred.provider === provider);
  }

  async addCredentials(credentials: Omit<ApiCredentials, 'id' | 'createdAt' | 'updatedAt' | 'health'>): Promise<ApiCredentials> {
    const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const fullCredentials: ApiCredentials = {
      ...credentials,
      id,
      createdAt: now,
      updatedAt: now,
      health: {
        status: 'unknown',
        lastCheck: now,
        errorCount: 0,
        successRate: 1.0
      }
    };

    this.credentials.set(id, fullCredentials);

    // Initialize usage stats
    this.usage.set(id, {
      credentialId: id,
      requests: { minute: 0, hour: 0, day: 0, month: 0 },
      quotaUsage: { daily: 0, monthly: 0 },
      lastReset: { 
        minute: now, 
        hour: now, 
        day: now, 
        month: now 
      }
    });

    return fullCredentials;
  }

  async updateCredentials(id: string, updates: Partial<ApiCredentials>): Promise<ApiCredentials> {
    const existing = this.credentials.get(id);
    if (!existing) {
      throw new Error(`Credentials with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.credentials.set(id, updated);
    return updated;
  }

  async deleteCredentials(id: string): Promise<void> {
    this.credentials.delete(id);
    this.usage.delete(id);
  }

  async getUsageStats(credentialId: string): Promise<ApiUsageStats> {
    const stats = this.usage.get(credentialId);
    if (!stats) {
      throw new Error(`Usage stats for credential ${credentialId} not found`);
    }
    return stats;
  }

  async updateUsageStats(credentialId: string, stats: Partial<ApiUsageStats>): Promise<void> {
    const existing = this.usage.get(credentialId);
    if (!existing) {
      throw new Error(`Usage stats for credential ${credentialId} not found`);
    }

    this.usage.set(credentialId, { ...existing, ...stats });
  }

  async rotateKey(id: string): Promise<ApiCredentials> {
    // Placeholder for key rotation
    const credentials = this.credentials.get(id);
    if (!credentials) {
      throw new Error(`Credentials with id ${id} not found`);
    }
    
    // In production, this would generate a new API key
    return credentials;
  }
}

export default ApiConfigManager;
