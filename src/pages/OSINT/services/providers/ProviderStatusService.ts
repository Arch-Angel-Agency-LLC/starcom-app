/**
 * Provider Status Service
 * 
 * Provides real-time status information about OSINT and NetRunner API providers.
 * Shows whether providers are using real APIs or mock data, and their health status.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import { apiConfigManager } from '../../../../shared/config/ApiConfigManager';

export interface ProviderStatus {
  id: string;
  name: string;
  type: 'shodan' | 'virustotal' | 'censys' | 'theharvester' | 'osint_api';
  isEnabled: boolean;
  hasApiKey: boolean;
  isRealApi: boolean;
  status: 'connected' | 'error' | 'disabled' | 'mock';
  lastCheck?: Date;
  errorMessage?: string;
  statusIcon: '🟢' | '🟡' | '🔴' | '⚪';
  description: string;
}

export interface ProviderHealthCheck {
  providerId: string;
  isHealthy: boolean;
  responseTime?: number;
  errorMessage?: string;
  timestamp: Date;
}

class ProviderStatusService {
  private statusCache = new Map<string, ProviderStatus>();
  private healthCheckInterval = 60000; // 1 minute
  private healthCheckTimer?: NodeJS.Timeout;

  constructor() {
    this.initializeProviderStatuses();
    this.startHealthChecking();
  }

  /**
   * Get status for all providers
   */
  getAllProviderStatuses(): ProviderStatus[] {
    return Array.from(this.statusCache.values());
  }

  /**
   * Get status for a specific provider
   */
  getProviderStatus(providerId: string): ProviderStatus | undefined {
    return this.statusCache.get(providerId);
  }

  /**
   * Initialize provider statuses based on current configuration
   */
  private initializeProviderStatuses(): void {
    const providers: ProviderStatus[] = [
      {
        id: 'shodan',
        name: 'Shodan',
        type: 'shodan',
        isEnabled: apiConfigManager.isProviderEnabled('shodan'),
        hasApiKey: !!apiConfigManager.getProviderConfig('shodan')?.apiKey,
        isRealApi: apiConfigManager.shouldUseRealApis() && apiConfigManager.isProviderEnabled('shodan'),
        status: this.calculateStatus('shodan'),
        statusIcon: this.getStatusIcon('shodan'),
        description: 'Internet-connected device search engine'
      },
      {
        id: 'virustotal',
        name: 'VirusTotal',
        type: 'virustotal',
        isEnabled: apiConfigManager.isProviderEnabled('virustotal'),
        hasApiKey: !!apiConfigManager.getProviderConfig('virustotal')?.apiKey,
        isRealApi: apiConfigManager.shouldUseRealApis() && apiConfigManager.isProviderEnabled('virustotal'),
        status: this.calculateStatus('virustotal'),
        statusIcon: this.getStatusIcon('virustotal'),
        description: 'File and URL threat intelligence platform'
      },
      {
        id: 'censys',
        name: 'Censys',
        type: 'censys',
        isEnabled: apiConfigManager.isProviderEnabled('censys'),
        hasApiKey: !!apiConfigManager.getProviderConfig('censys')?.apiKey,
        isRealApi: apiConfigManager.shouldUseRealApis() && apiConfigManager.isProviderEnabled('censys'),
        status: this.calculateStatus('censys'),
        statusIcon: this.getStatusIcon('censys'),
        description: 'Internet-wide scanning and enumeration platform'
      },
      {
        id: 'theharvester',
        name: 'TheHarvester',
        type: 'theharvester',
        isEnabled: apiConfigManager.isProviderEnabled('theharvester'),
        hasApiKey: true, // TheHarvester doesn't require API keys for basic functionality
        isRealApi: apiConfigManager.shouldUseRealApis() && apiConfigManager.isProviderEnabled('theharvester'),
        status: this.calculateStatus('theharvester'),
        statusIcon: this.getStatusIcon('theharvester'),
        description: 'Email and subdomain enumeration tool'
      },
      {
        id: 'osint_api',
        name: 'OSINT Mock API',
        type: 'osint_api',
        isEnabled: true,
        hasApiKey: true,
        isRealApi: false,
        status: 'connected',
        statusIcon: '🟡',
        description: 'Mock OSINT API for demonstration and testing'
      }
    ];

    providers.forEach(provider => {
      this.statusCache.set(provider.id, provider);
    });
  }

  /**
   * Calculate the status based on configuration and availability
   */
  private calculateStatus(providerId: string): ProviderStatus['status'] {
    if (!apiConfigManager.isProviderEnabled(providerId)) {
      return 'disabled';
    }

    if (!apiConfigManager.shouldUseRealApis()) {
      return 'mock';
    }

    const credentials = apiConfigManager.getProviderConfig(providerId);
    if (!credentials || (providerId !== 'theharvester' && !this.hasRequiredCredentials(providerId, credentials as unknown as Record<string, unknown>))) {
      return 'error';
    }

    return 'connected';
  }

  /**
   * Check if provider has required credentials
   */
  private hasRequiredCredentials(providerId: string, credentials: Record<string, unknown>): boolean {
    switch (providerId) {
      case 'shodan':
      case 'virustotal':
        return !!credentials.apiKey;
      case 'censys':
        return !!credentials.appId && !!credentials.secret;
      case 'theharvester':
        return true; // No API key required
      default:
        return false;
    }
  }

  /**
   * Get status icon based on current state
   */
  private getStatusIcon(providerId: string): ProviderStatus['statusIcon'] {
    const status = this.calculateStatus(providerId);
    
    switch (status) {
      case 'connected':
        return '🟢';
      case 'mock':
        return '🟡';
      case 'error':
        return '🔴';
      case 'disabled':
        return '⚪';
      default:
        return '⚪';
    }
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(() => {
      this.updateProviderStatuses();
    }, this.healthCheckInterval);
  }

  /**
   * Stop health checking
   */
  stopHealthChecking(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Update provider statuses
   */
  private updateProviderStatuses(): void {
    this.statusCache.forEach((provider, providerId) => {
      const updatedProvider: ProviderStatus = {
        ...provider,
        isEnabled: apiConfigManager.isProviderEnabled(providerId),
        hasApiKey: this.hasRequiredCredentials(providerId, apiConfigManager.getProviderConfig(providerId) as unknown as Record<string, unknown> || {}),
        isRealApi: apiConfigManager.shouldUseRealApis() && apiConfigManager.isProviderEnabled(providerId),
        status: this.calculateStatus(providerId),
        statusIcon: this.getStatusIcon(providerId),
        lastCheck: new Date()
      };

      this.statusCache.set(providerId, updatedProvider);
    });
  }

  /**
   * Manual refresh of provider statuses
   */
  refreshProviderStatuses(): void {
    this.updateProviderStatuses();
  }

  /**
   * Get summary statistics
   */
  getStatusSummary(): {
    total: number;
    connected: number;
    mock: number;
    error: number;
    disabled: number;
    realApiPercentage: number;
  } {
    const statuses = this.getAllProviderStatuses();
    
    return {
      total: statuses.length,
      connected: statuses.filter(p => p.status === 'connected').length,
      mock: statuses.filter(p => p.status === 'mock').length,
      error: statuses.filter(p => p.status === 'error').length,
      disabled: statuses.filter(p => p.status === 'disabled').length,
      realApiPercentage: Math.round((statuses.filter(p => p.isRealApi).length / statuses.length) * 100)
    };
  }
}

// Export singleton instance
export const providerStatusService = new ProviderStatusService();
