// Intel Data Provider for the centralized data management system
// Migrates functionality from IntelReportService.ts to the new provider pattern
// Supports intelligence reports from Solana blockchain and other sources

import { 
  DataProvider, 
  DataServiceObserver, 
  EndpointConfig, 
  FetchOptions 
} from '../interfaces';
import { IntelReportData } from '../../../models/IntelReportData';
import { Connection, PublicKey } from '@solana/web3.js';

// Intel Data Types
export interface IntelReport {
  pubkey: string;
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string;
  signature?: string;
  verified?: boolean;
  classification?: 'UNCLASS' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  source?: 'SIGINT' | 'HUMINT' | 'GEOINT' | 'OSINT' | 'COMINT';
}

export interface IntelSummary {
  total_reports: number;
  recent_reports: number;
  top_tags: string[];
  geographic_coverage: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
  last_updated: string;
}

export interface IntelMetrics {
  reports_by_tag: Record<string, number>;
  reports_by_author: Record<string, number>;
  reports_by_region: Record<string, number>;
  temporal_distribution: Array<{
    date: string;
    count: number;
  }>;
}

// Union type for all Intel data
export type IntelDataTypes = 
  | IntelReport[] 
  | IntelReportData[]
  | IntelSummary 
  | IntelMetrics;

export class IntelDataProvider implements DataProvider<IntelDataTypes> {
  public readonly id = 'intel-reports';
  public readonly name = 'Intelligence Data Provider';
  
  public readonly endpoints: EndpointConfig[] = [
    // Solana blockchain intel reports
    {
      id: 'solana-intel-reports',
      url: 'solana://program-accounts', // Special URL format for Solana
      method: 'GET'
    },
    // Intelligence summary endpoint
    {
      id: 'intel-summary',
      url: 'https://api.starcom.app/intel/summary',
      method: 'GET'
    },
    // Intelligence metrics endpoint
    {
      id: 'intel-metrics',
      url: 'https://api.starcom.app/intel/metrics',
      method: 'GET'
    },
    // OSINT aggregation endpoint
    {
      id: 'osint-feeds',
      url: 'https://api.starcom.app/intel/osint',
      method: 'GET'
    },
    // Legacy intelligence API
    {
      id: 'intel-legacy',
      url: 'https://api.starcom.app/intelligence',
      method: 'GET'
    }
  ];

  private observer?: DataServiceObserver;
  private connection?: Connection;
  private programId?: PublicKey;

  constructor(connection?: Connection, programId?: string) {
    this.connection = connection;
    if (programId) {
      try {
        this.programId = new PublicKey(programId);
      } catch (error) {
        console.warn('Invalid Solana program ID provided:', error);
      }
    }
  }

  async fetchData(key: string, _options: FetchOptions = {}): Promise<IntelDataTypes> {
    this.observer?.onFetchStart?.(key, this.id);

    try {
      let result: IntelDataTypes;

      switch (key) {
        case 'solana-intel-reports':
          result = await this.fetchSolanaIntelReports();
          break;
        case 'intel-summary':
          result = await this.fetchIntelSummary();
          break;
        case 'intel-metrics':
          result = await this.fetchIntelMetrics();
          break;
        case 'osint-feeds':
          result = await this.fetchOSINTFeeds();
          break;
        case 'intel-legacy':
        default:
          result = await this.fetchLegacyIntelReports();
          break;
      }

      this.observer?.onFetchEnd?.(key, 0, this.id);
      return result;
    } catch (error) {
      this.observer?.onError?.(key, error as Error, this.id);
      throw error;
    }
  }

  // Migrated from IntelReportService.ts
  private async fetchSolanaIntelReports(): Promise<IntelReportData[]> {
    if (!this.connection || !this.programId) {
      console.warn('Solana connection or program ID not configured, returning placeholder data');
      return this.getPlaceholderData();
    }

    try {
      console.log('Fetching intel reports from Solana program:', this.programId.toString());
      
      // TODO: Implement actual account fetching once program is deployed
      // const accounts = await this.connection.getProgramAccounts(this.programId);
      
      return this.getPlaceholderData();
    } catch (error) {
      console.error('Error fetching Solana intel reports:', error);
      // Return placeholder data for MVP development
      return this.getPlaceholderData();
    }
  }

  // New intelligence summary endpoint
  private async fetchIntelSummary(): Promise<IntelSummary> {
    const endpoint = this.endpoints.find(e => e.id === 'intel-summary');
    if (!endpoint) {
      throw new Error('Intel summary endpoint not configured');
    }

    const response = await fetch(endpoint.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch intel summary: ${response.status}`);
    }

    const data = await response.json() as IntelSummary;
    return data;
  }

  // New intelligence metrics endpoint
  private async fetchIntelMetrics(): Promise<IntelMetrics> {
    const endpoint = this.endpoints.find(e => e.id === 'intel-metrics');
    if (!endpoint) {
      throw new Error('Intel metrics endpoint not configured');
    }

    const response = await fetch(endpoint.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch intel metrics: ${response.status}`);
    }

    const data = await response.json() as IntelMetrics;
    return data;
  }

  // New OSINT feeds aggregation
  private async fetchOSINTFeeds(): Promise<IntelReport[]> {
    const endpoint = this.endpoints.find(e => e.id === 'osint-feeds');
    if (!endpoint) {
      throw new Error('OSINT feeds endpoint not configured');
    }

    const response = await fetch(endpoint.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch OSINT feeds: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform OSINT data to our IntelReport format
    if (Array.isArray(data)) {
      return data.map(item => this.transformToIntelReport(item));
    }
    
    return [];
  }

  // Legacy intel reports fallback
  private async fetchLegacyIntelReports(): Promise<IntelReport[]> {
    const endpoint = this.endpoints.find(e => e.id === 'intel-legacy');
    if (!endpoint) {
      throw new Error('Legacy intel endpoint not configured');
    }

    const response = await fetch(endpoint.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch legacy intel reports: ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map(item => this.transformToIntelReport(item));
    }
    
    return [];
  }

  // Migrated placeholder data from IntelReportService
  private getPlaceholderData(): IntelReportData[] {
    return [
      {
        pubkey: 'placeholder-1',
        title: 'Sample Intel Report - Anomalous Signal',
        content: 'Detected unusual electromagnetic patterns in sector 7G. Signal characteristics suggest artificial origin with periodic burst transmission every 47 minutes.',
        tags: ['SIGINT', 'ELECTROMAGNETIC', 'PATTERN_ANALYSIS'],
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now() - 3600000, // 1 hour ago
        author: 'Agent-Alpha-7'
      },
      {
        pubkey: 'placeholder-2', 
        title: 'Geomagnetic Disturbance Alert',
        content: 'Significant geomagnetic disturbance detected at 15:30 UTC. Potential space weather event affecting satellite communications in northern hemisphere.',
        tags: ['GEOMAGNETIC', 'SPACE_WEATHER', 'COMMS_DISRUPTION'],
        latitude: 64.2008,
        longitude: -149.4937,
        timestamp: Date.now() - 7200000, // 2 hours ago
        author: 'Station-BRAVO'
      },
      {
        pubkey: 'placeholder-3',
        title: 'Unusual Network Traffic Pattern',
        content: 'Monitoring systems detected anomalous network traffic patterns indicating possible coordinated activity. Traffic analysis shows encrypted payloads with non-standard protocols.',
        tags: ['SIGINT', 'NETWORK_ANALYSIS', 'ENCRYPTED_COMMS'],
        latitude: 51.5074,
        longitude: -0.1278,
        timestamp: Date.now() - 10800000, // 3 hours ago
        author: 'Cyber-Delta-9'
      }
    ];
  }

  // Transform various data formats to our IntelReport interface
  private transformToIntelReport(data: Record<string, unknown>): IntelReport {
    return {
      pubkey: (data.id as string) || (data.pubkey as string) || `generated-${Date.now()}`,
      title: (data.title as string) || (data.subject as string) || 'Unknown Title',
      content: (data.content as string) || (data.description as string) || (data.text as string) || '',
      tags: (data.tags as string[]) || (data.categories as string[]) || (data.keywords as string[]) || [],
      latitude: (data.latitude as number) || (data.lat as number) || ((data.location as Record<string, unknown>)?.lat as number) || 0,
      longitude: (data.longitude as number) || (data.lng as number) || ((data.location as Record<string, unknown>)?.lng as number) || 0,
      timestamp: (data.timestamp as number) || (data.created_at as number) || Date.now(),
      author: (data.author as string) || (data.source as string) || (data.collector as string) || 'Unknown',
      classification: (data.classification as 'UNCLASS' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET') || 'UNCLASS',
      source: (data.intel_type as 'SIGINT' | 'HUMINT' | 'GEOINT' | 'OSINT' | 'COMINT') || (data.source_type as 'SIGINT' | 'HUMINT' | 'GEOINT' | 'OSINT' | 'COMINT') || 'OSINT',
      verified: (data.verified as boolean) || false
    };
  }

  // Filter intel reports by various criteria
  filterReports(reports: IntelReport[], filters: {
    tags?: string[];
    timeRange?: { start: number; end: number };
    geographic?: { bounds: { north: number; south: number; east: number; west: number } };
    classification?: string[];
    author?: string[];
  }): IntelReport[] {
    return reports.filter(report => {
      // Tag filtering
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          report.tags.some(reportTag => 
            reportTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      // Time range filtering
      if (filters.timeRange) {
        if (report.timestamp < filters.timeRange.start || report.timestamp > filters.timeRange.end) {
          return false;
        }
      }

      // Geographic filtering
      if (filters.geographic) {
        const { bounds } = filters.geographic;
        if (report.latitude < bounds.south || report.latitude > bounds.north ||
            report.longitude < bounds.west || report.longitude > bounds.east) {
          return false;
        }
      }

      // Classification filtering
      if (filters.classification && filters.classification.length > 0) {
        if (!filters.classification.includes(report.classification || 'UNCLASS')) {
          return false;
        }
      }

      // Author filtering
      if (filters.author && filters.author.length > 0) {
        if (!filters.author.includes(report.author)) {
          return false;
        }
      }

      return true;
    });
  }

  subscribe(
    key: string,
    onData: (data: IntelDataTypes) => void,
    options: { interval?: number } = {}
  ): () => void {
    const interval = options.interval || 300000; // Default 5 minutes for intel reports
    
    // Initial fetch
    this.fetchData(key).then(onData).catch(error => {
      this.observer?.onError?.(key, error, this.id);
    });

    // Set up polling
    const intervalId = setInterval(async () => {
      try {
        const data = await this.fetchData(key);
        onData(data);
      } catch (error) {
        this.observer?.onError?.(key, error as Error, this.id);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  setObserver(observer: DataServiceObserver): void {
    this.observer = observer;
  }

  validateData(data: unknown): data is IntelDataTypes {
    if (Array.isArray(data)) {
      // Check if it's an array of IntelReports or IntelReportData
      if (data.length === 0) return true; // Empty array is valid
      
      const firstItem = data[0];
      return (
        typeof firstItem === 'object' && 
        firstItem !== null &&
        'title' in firstItem && 
        'content' in firstItem &&
        'timestamp' in firstItem
      );
    }
    
    // Check if it's IntelSummary format
    if (typeof data === 'object' && data !== null && 'total_reports' in data) {
      return true;
    }
    
    // Check if it's IntelMetrics format
    if (typeof data === 'object' && data !== null && 'reports_by_tag' in data) {
      return true;
    }
    
    return false;
  }

  transformData(rawData: unknown): IntelDataTypes {
    if (!this.validateData(rawData)) {
      throw new Error('Invalid intel data format');
    }
    return rawData;
  }

  // Utility methods
  getEndpointConfig(key: string): EndpointConfig | undefined {
    return this.endpoints.find(e => e.id === key);
  }

  getSupportedEndpoints(): string[] {
    return this.endpoints.map(e => e.id);
  }

  // Configure Solana connection
  configureSolana(connection: Connection, programId: string): void {
    this.connection = connection;
    try {
      this.programId = new PublicKey(programId);
    } catch (error) {
      console.error('Invalid Solana program ID:', error);
      throw new Error('Invalid Solana program ID');
    }
  }
}
