/**
 * NetRunner API Configuration Manager
 * 
 * Re-export of shared API configuration manager for NetRunner components
 * 
 * @author GitHub Copilot
 * @date July 18, 2025
 */

export {
  apiConfigManager
} from '../../../../shared/config/ApiConfigManager';

export type {
  ApiProviderConfig,
  UnifiedApiConfig
} from '../../../../shared/config/ApiConfigManager';

// Define missing types that are needed by NetRunner components
export interface ApiCredential {
  id: string;
  service: string;
  name: string;
  apiKey: string;
  created: Date;
  lastUsed?: Date;
  isActive: boolean;
  config?: Record<string, string>;
}

export interface RateLimitInfo {
  provider: string;
  used: { day: number };
  limit: { day: number };
  resetTime: Date;
}

export class ApiConfigManager {
  private static instance: ApiConfigManager;
  
  private constructor() {}
  
  static getInstance(): ApiConfigManager {
    if (!this.instance) {
      this.instance = new ApiConfigManager();
    }
    return this.instance;
  }
  
  // Mock store for credentials in-memory during session
  private credentials: ApiCredential[] = [];

  async getCredentials(service: string): Promise<ApiCredential[]> {
    return this.credentials.filter(c => c.service === service);
  }

  async addCredentials(cred: { service: string; name: string; apiKey: string; config?: Record<string, string>; isActive?: boolean }): Promise<ApiCredential> {
    const newCred: ApiCredential = {
      id: `${cred.service}-${Date.now()}`,
      service: cred.service,
      name: cred.name,
      apiKey: cred.apiKey,
      isActive: cred.isActive ?? true,
      created: new Date(),
      config: cred.config || {}
    };
    this.credentials.push(newCred);
    return newCred;
  }

  async removeCredentials(credentialId: string): Promise<void> {
    this.credentials = this.credentials.filter(c => c.id !== credentialId);
  }

  async updateCredentials(credentialId: string, update: Partial<Pick<ApiCredential, 'isActive' | 'apiKey' | 'name'>>): Promise<void> {
    const idx = this.credentials.findIndex(c => c.id === credentialId);
    if (idx >= 0) {
      this.credentials[idx] = { ...this.credentials[idx], ...update };
    }
  }

  async checkRateLimit(credentialId: string): Promise<RateLimitInfo> {
    return {
      provider: credentialId,
      used: { day: Math.floor(Math.random() * 100) },
      limit: { day: 1000 },
      resetTime: new Date(Date.now() + 3600_000)
    };
  }

  async validateApiKey(_provider: string, apiKey: string): Promise<boolean> {
    // Placeholder implementation
    return apiKey.length > 0;
  }
  
  async getRateLimitInfo(provider: string): Promise<RateLimitInfo> {
    return {
      provider,
      used: { day: 0 },
      limit: { day: 1000 },
      resetTime: new Date(Date.now() + 3600_000)
    };
  }
  
  async getApiCredential(_provider: string): Promise<ApiCredential | null> {
    return null;
  }
}
