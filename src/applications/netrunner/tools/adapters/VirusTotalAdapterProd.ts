/**
 * Production VirusTotal API Adapter
 * 
 * Real integration with VirusTotal API for threat intelligence and malware analysis.
 * Implements comprehensive threat detection, URL/file scanning, and domain analysis.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { 
  ToolExecutionRequest, 
  ToolExecutionResponse, 
  ToolSchema,
  findToolById
} from '../NetRunnerPowerTools';
import { BaseAdapter } from './BaseAdapter';
import { apiConfigManager } from '../../../../shared/config/ApiConfigManager';

// VirusTotal API Types
export interface VirusTotalScanResult {
  scan_id: string;
  sha256: string;
  resource: string;
  response_code: number;
  verbose_msg: string;
  permalink: string;
  scan_date: string;
  positives: number;
  total: number;
  scans: Record<string, VirusTotalEngineResult>;
}

export interface VirusTotalEngineResult {
  detected: boolean;
  version: string;
  result: string | null;
  update: string;
}

export interface VirusTotalUrlReport {
  response_code: number;
  resource: string;
  scan_id: string;
  scan_date: string;
  url: string;
  verbose_msg: string;
  filescan_id: string;
  positives: number;
  total: number;
  scans: Record<string, VirusTotalEngineResult>;
}

export interface VirusTotalDomainReport {
  response_code: number;
  verbose_msg: string;
  domain: string;
  detected_urls: Array<{
    url: string;
    positives: number;
    total: number;
    scan_date: string;
  }>;
  detected_downloaded_samples: Array<{
    sha256: string;
    date: string;
    positives: number;
    total: number;
  }>;
  detected_communicating_samples: Array<{
    sha256: string;
    date: string;
    positives: number;
    total: number;
  }>;
  undetected_downloaded_samples: Array<{
    sha256: string;
    date: string;
    positives: number;
    total: number;
  }>;
  resolutions: Array<{
    last_resolved: string;
    ip_address: string;
  }>;
}

// Real VirusTotal API client implementation
class VirusTotalApiClient {
  private apiKey: string;
  private baseUrl = 'https://www.virustotal.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeUrl(url: string): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/vtapi/v2/url/report`, {
        params: {
          apikey: this.apiKey,
          resource: url
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid VirusTotal API key or quota exceeded');
        }
        throw new Error(`VirusTotal API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async analyzeDomain(domain: string): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/vtapi/v2/domain/report`, {
        params: {
          apikey: this.apiKey,
          domain: domain
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid VirusTotal API key or quota exceeded');
        }
        throw new Error(`VirusTotal API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async analyzeIp(ip: string): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/vtapi/v2/ip-address/report`, {
        params: {
          apikey: this.apiKey,
          ip: ip
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid VirusTotal API key or quota exceeded');
        }
        throw new Error(`VirusTotal API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async analyzeFile(hash: string): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/vtapi/v2/file/report`, {
        params: {
          apikey: this.apiKey,
          resource: hash
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid VirusTotal API key or quota exceeded');
        }
        throw new Error(`VirusTotal API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async submitUrl(url: string): Promise<Record<string, unknown>> {
    try {
      const formData = new URLSearchParams({
        apikey: this.apiKey,
        url: url
      });

      const response = await axios.post(`${this.baseUrl}/vtapi/v2/url/scan`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid VirusTotal API key or quota exceeded');
        }
        throw new Error(`VirusTotal API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }
}

export class VirusTotalAdapter extends BaseAdapter {
  private apiClient: VirusTotalApiClient | null = null;

  constructor() {
    const tool = findToolById('virustotal');
    const toolSchema: ToolSchema = {
      id: 'virustotal',
      name: tool?.name || 'VirusTotal',
      description: tool?.description || 'VirusTotal threat intelligence analysis',
      parameters: [
        {
          name: 'resource',
          type: 'string',
          description: 'Target resource (URL, IP, domain, or file hash)',
          required: true
        },
        {
          name: 'type',
          type: 'string',
          description: 'Type of resource to analyze',
          required: true,
          options: ['url', 'ip', 'domain', 'file']
        }
      ],
      outputFormat: {
        type: 'json'
      }
    };
    super('virustotal', toolSchema);
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if we have a valid API key
      const config = apiConfigManager.getProviderConfig('virustotal');
      if (config.enabled && config.apiKey) {
        this.apiClient = new VirusTotalApiClient(config.apiKey);
        console.log('VirusTotal adapter initialized with real API');
        return true;
      } else {
        console.log('VirusTotal adapter initialized without API key (will use mock data)');
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize VirusTotal adapter:', error);
      return false;
    }
  }

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    const startTime = Date.now();
    
    try {
      console.log('Executing VirusTotal analysis request:', request.parameters);

      // Validate required parameters
      const { resource, type } = request.parameters;
      if (!resource || !type) {
        return {
          requestId: request.requestId,
          toolId: this.getToolId(),
          status: 'error',
          error: 'Missing required parameters: resource and type',
          data: null,
          timestamp: Date.now()
        };
      }

      let analysisResult: Record<string, unknown>;

      // Use real API if available, otherwise mock data
      if (this.apiClient) {
        console.log(`Using real VirusTotal API for ${type} analysis`);
        analysisResult = await this.executeRealAnalysis(resource as string, type as string);
      } else {
        console.log(`Using mock VirusTotal data for ${type} analysis`);
        analysisResult = this.generateMockAnalysis(resource as string, type as string);
      }

      const executionTime = Date.now() - startTime;
      
      return {
        requestId: request.requestId,
        toolId: this.getToolId(),
        status: 'success',
        data: {
          ...analysisResult,
          metadata: {
            execution_time_ms: executionTime,
            timestamp: new Date().toISOString(),
            source: this.apiClient ? 'virustotal-api' : 'mock-data',
            query: resource,
            analysis_type: type
          }
        },
        executionTime,
        timestamp: Date.now()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('VirusTotal analysis failed:', error);
      
      return {
        requestId: request.requestId,
        toolId: this.getToolId(),
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        data: null,
        executionTime,
        timestamp: Date.now()
      };
    }
  }

  private async executeRealAnalysis(resource: string, type: string): Promise<Record<string, unknown>> {
    if (!this.apiClient) {
      throw new Error('API client not initialized');
    }

    // Add rate limiting
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second delay for free tier

    let rawData: Record<string, unknown>;

    switch (type) {
      case 'url':
        rawData = await this.apiClient.analyzeUrl(resource);
        break;
      case 'domain':
        rawData = await this.apiClient.analyzeDomain(resource);
        break;
      case 'ip':
        rawData = await this.apiClient.analyzeIp(resource);
        break;
      case 'file':
        rawData = await this.apiClient.analyzeFile(resource);
        break;
      default:
        throw new Error(`Unsupported analysis type: ${type}`);
    }

    // Transform the raw API response into a structured format
    return this.transformApiResponse(rawData, type, resource);
  }

  private transformApiResponse(rawData: Record<string, unknown>, type: string, resource: string): Record<string, unknown> {
    const response = rawData as Record<string, unknown>;
    
    if (response.response_code === 0) {
      return {
        resource,
        type,
        status: 'not_found',
        message: 'Resource not found in VirusTotal database',
        recommendation: 'Submit for analysis or try again later'
      };
    }

    const commonFields = {
      resource,
      type,
      status: 'analyzed',
      scan_date: response.scan_date,
      permalink: response.permalink
    };

    switch (type) {
      case 'url':
      case 'file':
        return {
          ...commonFields,
          positives: response.positives || 0,
          total: response.total || 0,
          threat_score: response.total ? ((response.positives as number) / (response.total as number)) : 0,
          scan_id: response.scan_id,
          engines: Object.entries((response.scans as Record<string, unknown>) || {}).map(([engine, result]) => ({
            engine,
            detected: (result as Record<string, unknown>).detected,
            result: (result as Record<string, unknown>).result,
            version: (result as Record<string, unknown>).version
          })),
          summary: {
            clean: ((response.total as number) || 0) - ((response.positives as number) || 0),
            malicious: response.positives || 0,
            threat_level: this.calculateThreatLevel((response.positives as number) || 0)
          }
        };

      case 'domain':
        return {
          ...commonFields,
          detected_urls: (response.detected_urls as unknown[])?.length || 0,
          detected_samples: (response.detected_downloaded_samples as unknown[])?.length || 0,
          communicating_samples: (response.detected_communicating_samples as unknown[])?.length || 0,
          dns_resolutions: ((response.resolutions as unknown[]) || []).slice(0, 10),
          threat_indicators: {
            malicious_urls: ((response.detected_urls as unknown[]) || []).slice(0, 5),
            recent_samples: ((response.detected_downloaded_samples as unknown[]) || []).slice(0, 3)
          },
          reputation: {
            threat_level: this.calculateDomainThreatLevel(((response.detected_urls as unknown[])?.length || 0)),
            total_detections: ((response.detected_urls as unknown[])?.length || 0) + ((response.detected_downloaded_samples as unknown[])?.length || 0)
          }
        };

      case 'ip':
        return {
          ...commonFields,
          country: response.country,
          asn: response.asn,
          as_owner: response.as_owner,
          detected_urls: (response.detected_urls as unknown[])?.length || 0,
          detected_samples: (response.detected_downloaded_samples as unknown[])?.length || 0,
          dns_resolutions: ((response.resolutions as unknown[]) || []).slice(0, 10),
          threat_indicators: {
            malicious_urls: ((response.detected_urls as unknown[]) || []).slice(0, 5),
            recent_samples: ((response.detected_downloaded_samples as unknown[]) || []).slice(0, 3)
          },
          reputation: {
            threat_level: this.calculateDomainThreatLevel(((response.detected_urls as unknown[])?.length || 0)),
            total_detections: ((response.detected_urls as unknown[])?.length || 0) + ((response.detected_downloaded_samples as unknown[])?.length || 0)
          }
        };

      default:
        return rawData;
    }
  }

  private generateMockAnalysis(resource: string, type: string): Record<string, unknown> {
    // Generate realistic mock data for testing
    const mockData = {
      resource,
      type,
      status: 'analyzed',
      scan_date: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
      source: 'mock-data'
    };

    switch (type) {
      case 'url':
      case 'file': {
        const positives = Math.floor(Math.random() * 5); // 0-4 detections for mock
        const total = 65; // Typical number of engines
        return {
          ...mockData,
          positives,
          total,
          threat_score: positives / total,
          scan_id: `mock-${uuidv4()}`,
          engines: this.generateMockEngines(positives, total),
          summary: {
            clean: total - positives,
            malicious: positives,
            threat_level: this.calculateThreatLevel(positives)
          }
        };
      }

      case 'domain': {
        const detectedUrls = Math.floor(Math.random() * 10);
        const detectedSamples = Math.floor(Math.random() * 5);
        return {
          ...mockData,
          detected_urls: detectedUrls,
          detected_samples: detectedSamples,
          communicating_samples: Math.floor(Math.random() * 3),
          dns_resolutions: this.generateMockDnsResolutions(),
          threat_indicators: {
            malicious_urls: Array(Math.min(detectedUrls, 3)).fill(null).map(() => ({
              url: `https://example-malicious-${Math.random().toString(36).substring(7)}.com`,
              positives: Math.floor(Math.random() * 20),
              total: 65,
              scan_date: new Date(Date.now() - Math.random() * 86400000).toISOString()
            })),
            recent_samples: Array(Math.min(detectedSamples, 2)).fill(null).map(() => ({
              sha256: Array(64).fill(null).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
              date: new Date(Date.now() - Math.random() * 86400000).toISOString(),
              positives: Math.floor(Math.random() * 30)
            }))
          },
          reputation: {
            threat_level: this.calculateDomainThreatLevel(detectedUrls),
            total_detections: detectedUrls + detectedSamples
          }
        };
      }

      case 'ip': {
        const ipDetectedUrls = Math.floor(Math.random() * 8);
        const ipDetectedSamples = Math.floor(Math.random() * 3);
        return {
          ...mockData,
          country: ['US', 'CN', 'RU', 'DE', 'FR'][Math.floor(Math.random() * 5)],
          asn: `AS${Math.floor(Math.random() * 65535)}`,
          as_owner: ['CloudFlare', 'Amazon', 'Google', 'Microsoft', 'DigitalOcean'][Math.floor(Math.random() * 5)],
          detected_urls: ipDetectedUrls,
          detected_samples: ipDetectedSamples,
          dns_resolutions: this.generateMockDnsResolutions(),
          threat_indicators: {
            malicious_urls: Array(Math.min(ipDetectedUrls, 3)).fill(null).map(() => ({
              url: `https://suspicious-${Math.random().toString(36).substring(7)}.com`,
              positives: Math.floor(Math.random() * 15),
              total: 65,
              scan_date: new Date(Date.now() - Math.random() * 86400000).toISOString()
            }))
          },
          reputation: {
            threat_level: this.calculateDomainThreatLevel(ipDetectedUrls),
            total_detections: ipDetectedUrls + ipDetectedSamples
          }
        };
      }

      default:
        return mockData;
    }
  }

  private generateMockEngines(positives: number, total: number): Array<Record<string, unknown>> {
    const engines = ['Kaspersky', 'Bitdefender', 'Avast', 'AVG', 'McAfee', 'Symantec', 'ESET', 'Sophos'];
    const results: Array<Record<string, unknown>> = [];
    
    for (let i = 0; i < total; i++) {
      const engine = engines[i % engines.length] + (i >= engines.length ? ` ${Math.floor(i / engines.length) + 1}` : '');
      const detected = i < positives;
      results.push({
        engine,
        detected,
        result: detected ? ['Malware.Generic', 'Trojan.Win32', 'Adware.Generic'][Math.floor(Math.random() * 3)] : null,
        version: `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`
      });
    }
    
    return results;
  }

  private generateMockDnsResolutions(): Array<Record<string, unknown>> {
    return Array(Math.floor(Math.random() * 5) + 1).fill(null).map(() => ({
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      last_resolved: new Date(Date.now() - Math.random() * 2592000000).toISOString() // Random time in last 30 days
    }));
  }

  private calculateThreatLevel(positives: number): string {
    if (positives === 0) return 'clean';
    if (positives <= 2) return 'low';
    if (positives <= 5) return 'medium';
    return 'high';
  }

  private calculateDomainThreatLevel(detectedUrls: number): string {
    if (detectedUrls === 0) return 'clean';
    if (detectedUrls <= 3) return 'low';
    if (detectedUrls <= 10) return 'medium';
    return 'high';
  }

  async shutdown(): Promise<void> {
    this.apiClient = null;
  }
}
