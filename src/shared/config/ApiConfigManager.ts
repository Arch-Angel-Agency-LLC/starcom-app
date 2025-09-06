/**
 * Unified API Configuration Manager
 * 
 * Centralized configuration system for all OSINT and external APIs.
 * Handles environment variables, API key validation, and service health checking.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import { LoggerFactory } from '../../applications/netrunner/services/logging';

const logger = LoggerFactory.getLogger('UnifiedApiConfig');

export interface ApiProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  apiId?: string;
  secret?: string;
  enabled: boolean;
  rateLimit: number;
  timeout: number;
  requiresAuth: boolean;
}

export interface UnifiedApiConfig {
  // OSINT Tools
  shodan: ApiProviderConfig;
  virustotal: ApiProviderConfig;
  censys: ApiProviderConfig;
  hunter: ApiProviderConfig;
  theharvester: ApiProviderConfig;
  
  // Working External APIs
  weather: ApiProviderConfig;
  financial: ApiProviderConfig;
  conflicts: ApiProviderConfig;
  
  // Internal APIs
  starcom: ApiProviderConfig;
  osint: ApiProviderConfig;
  
  // System Configuration
  enableRealApis: boolean;
  debugMode: boolean;
  mockFallback: boolean;
}

class UnifiedApiConfigManager {
  private static instance: UnifiedApiConfigManager;
  private config: UnifiedApiConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): UnifiedApiConfigManager {
    if (!UnifiedApiConfigManager.instance) {
      UnifiedApiConfigManager.instance = new UnifiedApiConfigManager();
    }
    return UnifiedApiConfigManager.instance;
  }

  private loadConfiguration(): UnifiedApiConfig {
    // Helper function to get environment variable from either Vite or Node.js
  const getEnvVar = (key: string): string | undefined => {
      // In Vite environment (client-side)
      if (typeof import.meta !== 'undefined' && import.meta.env) {
    const val = import.meta.env[key] as unknown;
    if (typeof val === 'string') return val;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return String(val);
    return undefined;
      }
      // In Node.js environment (server-side/testing)
      if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
      }
      return undefined;
    };
    
    return {
      // OSINT Tools Configuration
      shodan: {
        id: 'shodan',
        name: 'Shodan',
        baseUrl: 'https://api.shodan.io',
        apiKey: getEnvVar('VITE_SHODAN_API_KEY'),
        enabled: !!getEnvVar('VITE_SHODAN_API_KEY'),
        rateLimit: 100, // requests per day for free tier
        timeout: 30000,
        requiresAuth: true
      },
      
      virustotal: {
        id: 'virustotal',
        name: 'VirusTotal',
        baseUrl: 'https://www.virustotal.com/api/v3',
        apiKey: getEnvVar('VITE_VIRUSTOTAL_API_KEY'),
        enabled: !!getEnvVar('VITE_VIRUSTOTAL_API_KEY'),
        rateLimit: 500, // requests per day for free tier
        timeout: 15000,
        requiresAuth: true
      },
      
      censys: {
        id: 'censys',
        name: 'Censys',
        baseUrl: 'https://search.censys.io/api',
        apiId: getEnvVar('VITE_CENSYS_API_ID'),
        secret: getEnvVar('VITE_CENSYS_SECRET'),
        enabled: !!(getEnvVar('VITE_CENSYS_API_ID') && getEnvVar('VITE_CENSYS_SECRET')),
        rateLimit: 200,
        timeout: 10000,
        requiresAuth: true
      },
      
      hunter: {
        id: 'hunter',
        name: 'Hunter.io',
        baseUrl: 'https://api.hunter.io',
        apiKey: getEnvVar('VITE_HUNTER_API_KEY'),
        enabled: !!getEnvVar('VITE_HUNTER_API_KEY'),
        rateLimit: 100,
        timeout: 10000,
        requiresAuth: true
      },
      
      theharvester: {
        id: 'theharvester',
        name: 'TheHarvester',
        baseUrl: 'local', // Command-line tool
        enabled: true, // Always available as it's a local tool
        rateLimit: 1000,
        timeout: 60000, // Longer timeout for command execution
        requiresAuth: false
      },
      
      // Working External APIs
      weather: {
        id: 'weather',
        name: 'OpenWeatherMap',
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: getEnvVar('VITE_OPENWEATHERMAP_API_KEY'),
        enabled: !!getEnvVar('VITE_OPENWEATHERMAP_API_KEY'),
        rateLimit: 1000,
        timeout: 5000,
        requiresAuth: true
      },
      
      financial: {
        id: 'financial',
        name: 'Alpha Vantage',
        baseUrl: 'https://www.alphavantage.co/query',
        apiKey: getEnvVar('VITE_ALPHA_VANTAGE_API_KEY'),
        enabled: !!getEnvVar('VITE_ALPHA_VANTAGE_API_KEY'),
        rateLimit: 500,
        timeout: 10000,
        requiresAuth: true
      },
      
      conflicts: {
        id: 'conflicts',
        name: 'ACLED',
        baseUrl: 'https://api.acleddata.com/acled/read',
        apiKey: getEnvVar('VITE_ACLED_API_KEY'),
        enabled: !!getEnvVar('VITE_ACLED_API_KEY'),
        rateLimit: 1000,
        timeout: 15000,
        requiresAuth: true
      },
      
      // Internal APIs
      starcom: {
        id: 'starcom',
        name: 'Starcom API',
        baseUrl: getEnvVar('VITE_STARCOM_API_URL') || 'https://api.starcom.app',
        enabled: true,
        rateLimit: 10000,
        timeout: 30000,
        requiresAuth: false
      },
      
      osint: {
        id: 'osint',
        name: 'OSINT API',
        baseUrl: getEnvVar('VITE_OSINT_API_URL') || 'https://api.starcom.app/osint',
        enabled: true,
        rateLimit: 10000,
        timeout: 30000,
        requiresAuth: false
      },
      
      // System Configuration
      enableRealApis: getEnvVar('VITE_ENABLE_REAL_APIS') === 'true',
      debugMode: getEnvVar('VITE_DEBUG_MODE') === 'true',
      mockFallback: getEnvVar('VITE_MOCK_FALLBACK') !== 'false'
    };
  }

  private validateConfiguration(): void {
    const enabledProviders = this.getEnabledProviders();
    const osintProviders = this.getOSINTProviders();
    const enabledOSINTCount = osintProviders.filter(p => p.enabled).length;

    logger.info('API Configuration loaded', {
      totalProviders: Object.keys(this.config).length - 3, // Exclude system config
      enabledProviders: enabledProviders.length,
      osintProviders: osintProviders.length,
      enabledOSINTProviders: enabledOSINTCount,
      realApisEnabled: this.config.enableRealApis,
      mockFallback: this.config.mockFallback
    });

    if (enabledOSINTCount === 0) {
      logger.warn('No OSINT providers configured with API keys - will use mock data only');
    }

    if (this.config.enableRealApis && enabledOSINTCount === 0) {
      logger.error('Real APIs enabled but no OSINT providers configured');
    }
  }

  /**
   * Get configuration for a specific provider
   */
  public getProviderConfig(providerId: string): ApiProviderConfig | null {
    return this.config[providerId as keyof UnifiedApiConfig] as ApiProviderConfig || null;
  }

  /**
   * Get all enabled providers
   */
  public getEnabledProviders(): ApiProviderConfig[] {
    return Object.values(this.config)
      .filter((config): config is ApiProviderConfig => 
        typeof config === 'object' && 'enabled' in config && config.enabled
      );
  }

  /**
   * Get OSINT-specific providers
   */
  public getOSINTProviders(): ApiProviderConfig[] {
    const osintProviderIds = ['shodan', 'virustotal', 'censys', 'hunter', 'theharvester'];
    return osintProviderIds
      .map(id => this.getProviderConfig(id))
      .filter((config): config is ApiProviderConfig => config !== null);
  }

  /**
   * Check if a provider is configured and enabled
   */
  public isProviderEnabled(providerId: string): boolean {
    const config = this.getProviderConfig(providerId);
    return config?.enabled || false;
  }

  /**
   * Check if real APIs should be used
   */
  public shouldUseRealApis(): boolean {
    return this.config.enableRealApis;
  }

  /**
   * Check if mock fallback is enabled
   */
  public hasMockFallback(): boolean {
    return this.config.mockFallback;
  }

  /**
   * Get system configuration
   */
  public getSystemConfig() {
    return {
      enableRealApis: this.config.enableRealApis,
      debugMode: this.config.debugMode,
      mockFallback: this.config.mockFallback
    };
  }

  /**
   * Validate API key for a provider
   */
  public async validateProvider(providerId: string): Promise<boolean> {
    const config = this.getProviderConfig(providerId);
    if (!config || !config.enabled) {
      return false;
    }

    try {
      // Basic validation - check if API key exists
      if (config.requiresAuth && !config.apiKey && !config.apiId) {
        logger.warn(`Provider ${providerId} requires authentication but no API key found`);
        return false;
      }

      // TODO: Add actual API health checks for each provider
      logger.debug(`Provider ${providerId} validation passed`);
      return true;
    } catch (error) {
      logger.error(`Provider ${providerId} validation failed`, error);
      return false;
    }
  }

  /**
   * Get health status of all providers
   */
  public async getProvidersHealth(): Promise<Record<string, boolean>> {
    const providers = this.getEnabledProviders();
    const healthChecks = await Promise.all(
      providers.map(async (provider) => ({
        id: provider.id,
        healthy: await this.validateProvider(provider.id)
      }))
    );

    return healthChecks.reduce((acc, { id, healthy }) => {
      acc[id] = healthy;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

// Export singleton instance
export const apiConfigManager = UnifiedApiConfigManager.getInstance();
export default apiConfigManager;
