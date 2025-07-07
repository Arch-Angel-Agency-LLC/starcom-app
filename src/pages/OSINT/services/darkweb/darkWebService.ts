/**
 * OSINT Dark Web Service
 * 
 * Provides secure access to dark web intelligence data.
 * Includes monitoring of forums, marketplaces, paste sites, and chat services.
 * All requests are routed through secure, anonymous channels.
 */

import { osintApi } from '../api/osintApi';
import osintEndpoints from '../api/endpoints';
import { createErrorDetail, ErrorDetail, ErrorUtils } from '../../types/errors';

/**
 * Dark web source types
 */
export type DarkWebSourceType = 
  | 'all'
  | 'forums'
  | 'marketplaces'
  | 'pastesites'
  | 'chats';

/**
 * Monitor status types
 */
export type MonitorStatus = 
  | 'active'
  | 'paused'
  | 'disabled';

/**
 * Alert level for dark web findings
 */
export type AlertLevel = 
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Dark web search result
 */
export interface DarkWebResult {
  id: string;
  title: string;
  content: string;
  source: {
    type: DarkWebSourceType;
    name: string;
    url: string;
  };
  date: string;
  relevanceScore: number;
  alertLevel: AlertLevel;
  tags: string[];
  mentions: string[];
}

/**
 * Monitor configuration
 */
export interface MonitorConfig {
  id: string;
  name: string;
  keywords: string[];
  sources: DarkWebSourceType[];
  alertThreshold: AlertLevel;
  status: MonitorStatus;
  lastRun?: string;
  alertCount: number;
}

/**
 * Alert from monitor
 */
export interface DarkWebAlert {
  id: string;
  monitorId: string;
  title: string;
  source: {
    type: DarkWebSourceType;
    name: string;
    url: string;
  };
  content: string;
  date: string;
  level: AlertLevel;
  tags: string[];
  seen: boolean;
}

/**
 * Source statistics
 */
export interface SourceStats {
  type: DarkWebSourceType;
  totalSources: number;
  activeSources: number;
  monitoredSources: number;
  lastUpdated: string;
}

/**
 * Dark Web Service class
 */
class DarkWebService {
  /**
   * Search the dark web
   */
  async search(
    query: string,
    options: {
      sourceType?: DarkWebSourceType;
      startDate?: string;
      endDate?: string;
      alertLevel?: AlertLevel;
      maxResults?: number;
    } = {}
  ): Promise<{ results: DarkWebResult[]; error?: ErrorDetail }> {
    try {
      // If in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        return { results: this.getMockSearchResults(query, options) };
      }
      
      const result = await osintApi.post<DarkWebResult[]>(osintEndpoints.darkweb.search, {
        query,
        ...options
      });
      
      if (result.success && result.data) {
        return { results: result.data };
      }
      
      return {
        results: [],
        error: createErrorDetail(result.error || 'Failed to search dark web', {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'darkWebSearch',
          retryable: true,
          userActions: [
            'Check your internet connection',
            'Try a different search query',
            'Retry the operation'
          ]
        })
      };
    } catch (error) {
      console.error('Error searching dark web:', error);
      
      // In development mode, return mock data instead of error
      if (process.env.NODE_ENV === 'development') {
        return { results: this.getMockSearchResults(query, options) };
      }
      
      return {
        results: [],
        error: createErrorDetail(
          ErrorUtils.getErrorMessage(error) || 'Failed to search dark web',
          {
            code: 'UNEXPECTED_ERROR',
            category: 'network',
            severity: 'error',
            operation: 'darkWebSearch',
            originalError: error instanceof Error ? error : undefined,
            retryable: true,
            userActions: [
              'Check your internet connection',
              'Try again later',
              'Contact support if the problem persists'
            ]
          }
        )
      };
    }
  }
  
  /**
   * Get active monitors
   */
  async getMonitors(): Promise<{ monitors: MonitorConfig[]; error?: ErrorDetail }> {
    try {
      // If in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        return { monitors: this.getMockMonitors() };
      }
      
      const result = await osintApi.get<MonitorConfig[]>(osintEndpoints.darkweb.monitor);
      
      if (result.success && result.data) {
        return { monitors: result.data };
      }
      
      return {
        monitors: [],
        error: createErrorDetail(result.error || 'Failed to get monitors', {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'getMonitors',
          retryable: true,
          userActions: [
            'Check your internet connection',
            'Retry the operation',
            'Contact support if the problem persists'
          ]
        })
      };
    } catch (error) {
      console.error('Error getting monitors:', error);
      
      // In development mode, return mock data instead of error
      if (process.env.NODE_ENV === 'development') {
        return { monitors: this.getMockMonitors() };
      }
      
      return {
        monitors: [],
        error: createErrorDetail(
          ErrorUtils.getErrorMessage(error) || 'Failed to get monitors',
          {
            code: 'UNEXPECTED_ERROR',
            category: 'network',
            severity: 'error',
            operation: 'getMonitors',
            originalError: error instanceof Error ? error : undefined,
            retryable: true,
            userActions: [
              'Check your internet connection',
              'Try again later',
              'Contact support if the problem persists'
            ]
          }
        )
      };
    }
  }
  
  /**
   * Create a new monitor
   */
  async createMonitor(config: Omit<MonitorConfig, 'id' | 'alertCount'>): Promise<{ monitor?: MonitorConfig; error?: ErrorDetail }> {
    try {
      // If in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        return { monitor: this.getMockCreatedMonitor(config) };
      }
      
      const result = await osintApi.post<MonitorConfig>(osintEndpoints.darkweb.monitor, config);
      
      if (result.success && result.data) {
        return { monitor: result.data };
      }
      
      return {
        error: createErrorDetail(result.error || 'Failed to create monitor', {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'createMonitor',
          retryable: true,
          userActions: [
            'Check monitor configuration',
            'Retry the operation',
            'Contact support if the problem persists'
          ]
        })
      };
    } catch (error) {
      console.error('Error creating monitor:', error);
      
      // In development mode, return mock data instead of error
      if (process.env.NODE_ENV === 'development') {
        return { monitor: this.getMockCreatedMonitor(config) };
      }
      
      return {
        error: createErrorDetail(
          ErrorUtils.getErrorMessage(error) || 'Failed to create monitor',
          {
            code: 'UNEXPECTED_ERROR',
            category: 'api',
            severity: 'error',
            operation: 'createMonitor',
            originalError: error instanceof Error ? error : undefined,
            retryable: true,
            userActions: [
              'Check your internet connection',
              'Verify your input data',
              'Try again later'
            ]
          }
        )
      };
    }
  }
  
  /**
   * Update monitor status
   */
  async updateMonitorStatus(id: string, status: MonitorStatus): Promise<{ success: boolean; error?: ErrorDetail }> {
    try {
      // If in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        return { success: true };
      }
      
      const result = await osintApi.patch(osintEndpoints.darkweb.monitor, {
        id,
        status
      });
      
      if (result.success) {
        return { success: true };
      }
      
      return {
        success: false,
        error: createErrorDetail(result.error || `Failed to update monitor status to ${status}`, {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'updateMonitorStatus',
          retryable: true,
          context: { monitorId: id, status },
          userActions: [
            'Retry the operation',
            'Check if the monitor still exists',
            'Contact support if the problem persists'
          ]
        })
      };
    } catch (error) {
      console.error('Error updating monitor status:', error);
      
      // In development mode, pretend it succeeded
      if (process.env.NODE_ENV === 'development') {
        return { success: true };
      }
      
      return {
        success: false,
        error: createErrorDetail(
          ErrorUtils.getErrorMessage(error) || `Failed to update monitor status to ${status}`,
          {
            code: 'UNEXPECTED_ERROR',
            category: 'api',
            severity: 'error',
            operation: 'updateMonitorStatus',
            originalError: error instanceof Error ? error : undefined,
            context: { monitorId: id, status },
            retryable: true,
            userActions: [
              'Check your internet connection',
              'Try again later'
            ]
          }
        )
      };
    }
  }
  
  /**
   * Get alerts from monitors
   */
  async getAlerts(options: {
    monitorId?: string;
    onlyUnseen?: boolean;
    minAlertLevel?: AlertLevel;
    maxResults?: number;
  } = {}): Promise<{ alerts: DarkWebAlert[]; error?: ErrorDetail }> {
    try {
      // If in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        return { alerts: this.getMockAlerts(options) };
      }
      
      const result = await osintApi.post<DarkWebAlert[]>(`${osintEndpoints.darkweb.monitor}/alerts`, options);
      
      if (result.success && result.data) {
        return { alerts: result.data };
      }
      
      return {
        alerts: [],
        error: createErrorDetail(result.error || 'Failed to get alerts', {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'getAlerts',
          retryable: true,
          context: { ...options },
          userActions: [
            'Check your internet connection',
            'Retry the operation',
            'Contact support if the problem persists'
          ]
        })
      };
    } catch (error) {
      console.error('Error getting alerts:', error);
      
      // In development mode, return mock data instead of error
      if (process.env.NODE_ENV === 'development') {
        return { alerts: this.getMockAlerts(options) };
      }
      
      return {
        alerts: [],
        error: createErrorDetail(
          ErrorUtils.getErrorMessage(error) || 'Failed to get alerts',
          {
            code: 'UNEXPECTED_ERROR',
            category: 'network',
            severity: 'error',
            operation: 'getAlerts',
            originalError: error instanceof Error ? error : undefined,
            context: { ...options },
            retryable: true,
            userActions: [
              'Check your internet connection',
              'Try again later',
              'Contact support if the problem persists'
            ]
          }
        )
      };
    }
  }
  
  /**
   * Get source statistics
   */
  async getSourceStats(): Promise<{ stats: SourceStats[]; error?: ErrorDetail }> {
    try {
      // If in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        return { stats: this.getMockSourceStats() };
      }
      
      const result = await osintApi.get<SourceStats[]>(`${osintEndpoints.darkweb.monitor}/stats`);
      
      if (result.success && result.data) {
        return { stats: result.data };
      }
      
      return {
        stats: [],
        error: createErrorDetail(result.error || 'Failed to get source statistics', {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'getSourceStats',
          retryable: true,
          userActions: [
            'Check your internet connection',
            'Retry the operation',
            'Contact support if the problem persists'
          ]
        })
      };
    } catch (error) {
      console.error('Error getting source statistics:', error);
      
      // In development mode, return mock data instead of error
      if (process.env.NODE_ENV === 'development') {
        return { stats: this.getMockSourceStats() };
      }
      
      return {
        stats: [],
        error: createErrorDetail(
          ErrorUtils.getErrorMessage(error) || 'Failed to get source statistics',
          {
            code: 'UNEXPECTED_ERROR',
            category: 'network',
            severity: 'error',
            operation: 'getSourceStats',
            originalError: error instanceof Error ? error : undefined,
            retryable: true,
            userActions: [
              'Check your internet connection',
              'Try again later',
              'Contact support if the problem persists'
            ]
          }
        )
      };
    }
  }
  
  /**
   * Check if dark web access is available
   */
  async checkDarkWebAccess(): Promise<{ 
    status?: { available: boolean; routingSecure: boolean; latency: number }; 
    error?: ErrorDetail 
  }> {
    try {
      // If in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        return { status: { available: true, routingSecure: true, latency: 230 } };
      }
      
      const result = await osintApi.get<{ available: boolean; routingSecure: boolean; latency: number }>(
        `${osintEndpoints.darkweb.monitor}/access`
      );
      
      if (result.success && result.data) {
        return { status: result.data };
      }
      
      return {
        error: createErrorDetail(result.error || 'Failed to check dark web access', {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'checkDarkWebAccess',
          retryable: true,
          userActions: [
            'Check your internet connection',
            'Retry the operation',
            'Check your VPN or secure connection'
          ]
        })
      };
    } catch (error) {
      console.error('Error checking dark web access:', error);
      
      // In development mode, return mock data instead of error
      if (process.env.NODE_ENV === 'development') {
        return { status: { available: true, routingSecure: true, latency: 230 } };
      }
      
      return {
        error: createErrorDetail(
          ErrorUtils.getErrorMessage(error) || 'Failed to check dark web access',
          {
            code: 'UNEXPECTED_ERROR',
            category: 'network',
            severity: 'error',
            operation: 'checkDarkWebAccess',
            originalError: error instanceof Error ? error : undefined,
            retryable: true,
            userActions: [
              'Check your internet connection',
              'Try again later',
              'Check your VPN or secure connection'
            ]
          }
        )
      };
    }
  }
  
  // MOCK DATA METHODS
  
  /**
   * Generate mock search results
   */
  private getMockSearchResults(
    query: string,
    options: {
      sourceType?: DarkWebSourceType;
      startDate?: string;
      endDate?: string;
      alertLevel?: AlertLevel;
      maxResults?: number;
    }
  ): DarkWebResult[] {
    const sourceType = options.sourceType || 'all';
    const maxResults = options.maxResults || 10;
    
    // Keywords that trigger high risk responses
    const highRiskKeywords = ['breach', 'hack', 'leaked', 'credentials', 'database', 'dump'];
    const mediumRiskKeywords = ['sell', 'buy', 'stolen', 'credit', 'card', 'exploit'];
    
    // Determine if query contains high-risk keywords
    const hasHighRisk = highRiskKeywords.some(keyword => query.toLowerCase().includes(keyword));
    const hasMediumRisk = mediumRiskKeywords.some(keyword => query.toLowerCase().includes(keyword));
    
    // Default alert level based on query content
    let defaultAlertLevel: AlertLevel = 'none';
    if (hasHighRisk) defaultAlertLevel = 'high';
    else if (hasMediumRisk) defaultAlertLevel = 'medium';
    else defaultAlertLevel = 'low';
    
    // Different sources by type
    const sources: Record<DarkWebSourceType, Array<{ name: string; url: string }>> = {
      forums: [
        { name: 'DarkForums', url: 'dforum.onion' },
        { name: 'HackTalk', url: 'hacktalk.onion' },
        { name: 'NullSec', url: 'nullsec.onion' }
      ],
      marketplaces: [
        { name: 'DarkMarket', url: 'darkmarket.onion' },
        { name: 'ShadowBay', url: 'shadowbay.onion' },
        { name: 'CryptoBazaar', url: 'cryptobazaar.onion' }
      ],
      pastesites: [
        { name: 'DeepPaste', url: 'deeppaste.onion' },
        { name: 'NullBin', url: 'nullbin.onion' },
        { name: 'DarkLeaks', url: 'darkleaks.onion' }
      ],
      chats: [
        { name: 'ShadowChat', url: 'shadowchat.onion' },
        { name: 'CryptTalk', url: 'crypttalk.onion' },
        { name: 'AnonyChat', url: 'anonychat.onion' }
      ],
      all: []
    };
    
    // Combine all sources for 'all' type
    sources.all = [
      ...sources.forums,
      ...sources.marketplaces,
      ...sources.pastesites,
      ...sources.chats
    ];
    
    // Source pool to choose from based on options
    const sourcePool = sourceType === 'all' ? sources.all : sources[sourceType];
    
    // Generate random results
    const results: DarkWebResult[] = [];
    
    // Sample content templates
    const contentTemplates = [
      `Found new [TYPE] related to [QUERY]. Users discussing [ACTIVITY].`,
      `[QUERY] mentioned in [TYPE] thread about [ACTIVITY].`,
      `New post on [TYPE] mentioning [QUERY] with potential [SEVERITY] implications.`,
      `User offering [QUERY] related [ITEMS] on [TYPE].`,
      `Discussion about [QUERY] in context of [ACTIVITY] found on [TYPE].`
    ];
    
    // Activities
    const activities = [
      'data breaches',
      'hacking tools',
      'credential sales',
      'identity theft',
      'financial fraud',
      'ransomware distribution',
      'vulnerability exploitation',
      'corporate espionage',
      'social engineering tactics'
    ];
    
    // Items
    const items = [
      'credentials',
      'personal data',
      'financial information',
      'access tokens',
      'exploit kits',
      'stolen accounts',
      'malware samples',
      'zero-day exploits'
    ];
    
    for (let i = 0; i < maxResults; i++) {
      // Select random source
      const source = sourcePool[Math.floor(Math.random() * sourcePool.length)];
      
      // Determine source type
      let sourceType: DarkWebSourceType;
      if (sources.forums.some(s => s.name === source.name)) sourceType = 'forums';
      else if (sources.marketplaces.some(s => s.name === source.name)) sourceType = 'marketplaces';
      else if (sources.pastesites.some(s => s.name === source.name)) sourceType = 'pastesites';
      else sourceType = 'chats';
      
      // Generate random date within last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      // Select random template and fill it
      const templateIndex = Math.floor(Math.random() * contentTemplates.length);
      const activityIndex = Math.floor(Math.random() * activities.length);
      const itemIndex = Math.floor(Math.random() * items.length);
      
      let content = contentTemplates[templateIndex]
        .replace('[TYPE]', sourceType)
        .replace('[QUERY]', query)
        .replace('[ACTIVITY]', activities[activityIndex])
        .replace('[ITEMS]', items[itemIndex])
        .replace('[SEVERITY]', defaultAlertLevel);
      
      // Add more context based on alert level
      if (defaultAlertLevel === 'high') {
        content += ` This appears to be part of a larger operation targeting multiple organizations.`;
      }
      
      // Generate title based on content
      const title = content.split('.')[0];
      
      // Generate tags
      const tags: string[] = [sourceType];
      if (hasHighRisk) tags.push('high-risk');
      if (hasMediumRisk) tags.push('medium-risk');
      tags.push(activities[activityIndex].split(' ')[0]);
      
      // Generate mentions
      const mentions = [query];
      if (Math.random() > 0.5) {
        mentions.push('Earth Alliance');
      }
      
      // Random relevance score, higher for high risk
      let relevanceScore = Math.random() * 0.5 + 0.5; // Base 0.5-1.0
      if (defaultAlertLevel === 'high') relevanceScore = Math.random() * 0.2 + 0.8; // 0.8-1.0
      
      results.push({
        id: `result-${i}-${Date.now()}`,
        title,
        content,
        source: {
          type: sourceType,
          name: source.name,
          url: source.url
        },
        date: date.toISOString(),
        relevanceScore,
        alertLevel: defaultAlertLevel,
        tags,
        mentions
      });
    }
    
    // Sort by relevance score descending
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  /**
   * Generate mock monitors
   */
  private getMockMonitors(): MonitorConfig[] {
    return [
      {
        id: 'monitor-1',
        name: 'Credential Leaks',
        keywords: ['credentials', 'password', 'breach', 'leak', 'Earth Alliance'],
        sources: ['all'],
        alertThreshold: 'low',
        status: 'active',
        lastRun: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        alertCount: 3
      },
      {
        id: 'monitor-2',
        name: 'Threat Actor Activity',
        keywords: ['Earth Alliance', 'attack', 'target', 'vulnerability'],
        sources: ['forums', 'chats'],
        alertThreshold: 'medium',
        status: 'active',
        lastRun: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        alertCount: 1
      },
      {
        id: 'monitor-3',
        name: 'Brand Mentions',
        keywords: ['Earth Alliance', 'Starcom', 'EA Security'],
        sources: ['all'],
        alertThreshold: 'low',
        status: 'paused',
        lastRun: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        alertCount: 5
      }
    ];
  }
  
  /**
   * Generate mock created monitor
   */
  private getMockCreatedMonitor(config: Omit<MonitorConfig, 'id' | 'alertCount'>): MonitorConfig {
    return {
      ...config,
      id: `monitor-${Date.now()}`,
      alertCount: 0,
      lastRun: new Date().toISOString()
    };
  }
  
  /**
   * Generate mock alerts
   */
  private getMockAlerts(options: {
    monitorId?: string;
    onlyUnseen?: boolean;
    minAlertLevel?: AlertLevel;
    maxResults?: number;
  }): DarkWebAlert[] {
    const maxResults = options.maxResults || 10;
    const monitors = this.getMockMonitors();
    
    // Filter monitors if monitorId is provided
    const relevantMonitors = options.monitorId
      ? monitors.filter(m => m.id === options.monitorId)
      : monitors;
    
    if (relevantMonitors.length === 0) {
      return [];
    }
    
    const alerts: DarkWebAlert[] = [];
    
    // Define alert levels for prioritization
    const alertLevels: AlertLevel[] = ['critical', 'high', 'medium', 'low', 'none'];
    const minAlertLevelIndex = options.minAlertLevel 
      ? alertLevels.indexOf(options.minAlertLevel) 
      : alertLevels.length - 1;
    
    // Sample content templates
    const contentTemplates = [
      `Alert: [KEYWORD] mentioned in [SOURCE]. [CONTEXT]`,
      `New activity detected regarding [KEYWORD] on [SOURCE]. [CONTEXT]`,
      `Potential security threat: [KEYWORD] found in [SOURCE] with [LEVEL] risk. [CONTEXT]`,
      `Monitor triggered: [KEYWORD] activity on [SOURCE]. [CONTEXT]`
    ];
    
    // Context snippets
    const contextSnippets = [
      `Users discussing potential vulnerabilities.`,
      `Mentions of data exfiltration tactics.`,
      `Discussion of targeting Earth Alliance systems.`,
      `Credentials being offered for sale.`,
      `New exploit targeting related systems.`,
      `Coordinated attack planning detected.`,
      `Sharing of internal documents or screenshots.`,
      `Phishing campaign targeting organization members.`
    ];
    
    for (const monitor of relevantMonitors) {
      // Generate 1-3 alerts per monitor
      const alertCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < alertCount && alerts.length < maxResults; i++) {
        // Random source type
        const sourceTypes: DarkWebSourceType[] = ['forums', 'marketplaces', 'pastesites', 'chats'];
        const sourceType = monitor.sources.includes('all')
          ? sourceTypes[Math.floor(Math.random() * sourceTypes.length)]
          : monitor.sources[Math.floor(Math.random() * monitor.sources.length)];
        
        // Random source name based on type
        let sourceName = '';
        let sourceUrl = '';
        
        switch (sourceType) {
          case 'forums':
            sourceName = ['DarkForums', 'HackTalk', 'NullSec'][Math.floor(Math.random() * 3)];
            sourceUrl = `${sourceName.toLowerCase()}.onion`;
            break;
          case 'marketplaces':
            sourceName = ['DarkMarket', 'ShadowBay', 'CryptoBazaar'][Math.floor(Math.random() * 3)];
            sourceUrl = `${sourceName.toLowerCase()}.onion`;
            break;
          case 'pastesites':
            sourceName = ['DeepPaste', 'NullBin', 'DarkLeaks'][Math.floor(Math.random() * 3)];
            sourceUrl = `${sourceName.toLowerCase()}.onion`;
            break;
          case 'chats':
            sourceName = ['ShadowChat', 'CryptTalk', 'AnonyChat'][Math.floor(Math.random() * 3)];
            sourceUrl = `${sourceName.toLowerCase()}.onion`;
            break;
        }
        
        // Random keyword from monitor
        const keyword = monitor.keywords[Math.floor(Math.random() * monitor.keywords.length)];
        
        // Random alert level at or above monitor threshold
        const thresholdIndex = alertLevels.indexOf(monitor.alertThreshold);
        const maxAlertIndex = Math.min(thresholdIndex, 2); // Don't go higher than "high" for mocks
        const alertLevelIndex = Math.floor(Math.random() * (maxAlertIndex + 1));
        const alertLevel = alertLevels[alertLevelIndex];
        
        // Skip if below minimum alert level
        if (alertLevelIndex > minAlertLevelIndex) {
          continue;
        }
        
        // Random seen status
        const seen = !(options.onlyUnseen || Math.random() > 0.6);
        
        // Random date within last 7 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        
        // Generate content
        const templateIndex = Math.floor(Math.random() * contentTemplates.length);
        const contextIndex = Math.floor(Math.random() * contextSnippets.length);
        
        const content = contentTemplates[templateIndex]
          .replace('[KEYWORD]', keyword)
          .replace('[SOURCE]', sourceName)
          .replace('[LEVEL]', alertLevel)
          .replace('[CONTEXT]', contextSnippets[contextIndex]);
        
        // Generate title based on content
        const title = content.split('.')[0];
        
        // Generate tags
        const tags: string[] = [sourceType, alertLevel];
        if (keyword.toLowerCase().includes('earth alliance')) {
          tags.push('organization');
        }
        if (keyword.toLowerCase().includes('credential') || keyword.toLowerCase().includes('breach')) {
          tags.push('credentials');
        }
        
        alerts.push({
          id: `alert-${alerts.length}-${Date.now()}`,
          monitorId: monitor.id,
          title,
          source: {
            type: sourceType,
            name: sourceName,
            url: sourceUrl
          },
          content,
          date: date.toISOString(),
          level: alertLevel,
          tags,
          seen
        });
      }
    }
    
    // Sort by date descending (newest first)
    return alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  /**
   * Generate mock source statistics
   */
  private getMockSourceStats(): SourceStats[] {
    const now = new Date().toISOString();
    
    return [
      {
        type: 'forums',
        totalSources: 24,
        activeSources: 18,
        monitoredSources: 12,
        lastUpdated: now
      },
      {
        type: 'marketplaces',
        totalSources: 15,
        activeSources: 9,
        monitoredSources: 8,
        lastUpdated: now
      },
      {
        type: 'pastesites',
        totalSources: 8,
        activeSources: 6,
        monitoredSources: 6,
        lastUpdated: now
      },
      {
        type: 'chats',
        totalSources: 12,
        activeSources: 7,
        monitoredSources: 5,
        lastUpdated: now
      }
    ];
  }
}

// Create singleton instance
export const darkWebService = new DarkWebService();

export default darkWebService;
