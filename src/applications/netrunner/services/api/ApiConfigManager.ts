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
  provider: string;
  apiKey: string;
  apiId?: string;
  secret?: string;
  created: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface RateLimitInfo {
  provider: string;
  remaining: number;
  limit: number;
  resetTime: Date;
  windowSize: number;
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
  
  async validateApiKey(_provider: string, apiKey: string): Promise<boolean> {
    // Placeholder implementation
    return apiKey.length > 0;
  }
  
  async getRateLimitInfo(provider: string): Promise<RateLimitInfo> {
    // Placeholder implementation
    return {
      provider,
      remaining: 1000,
      limit: 1000,
      resetTime: new Date(Date.now() + 3600000), // 1 hour from now
      windowSize: 3600
    };
  }
  
  async getApiCredential(_provider: string): Promise<ApiCredential | null> {
    // Placeholder implementation
    return null;
  }
}
