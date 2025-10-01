/**
 * IntelReport Architecture - Unified Type Definitions
 * 
 * This file consolidates all IntelReport types to prevent naming conflicts
 * and provides clear separation between different use cases.
 */

import { IntelReportDataPack } from './IntelReportDataPack';
import type { 
  PackageSignature,
  PackageEncryption,
  PackageAccessControl,
  DistributionMetadata,
  MarketplaceMetadata
} from './IntelReportPackage';

/**
 * ==========================================
 * CORE TYPE HIERARCHY (NO NAMING CONFLICTS)
 * ==========================================
 */

/**
 * Lightweight metadata for NFT/blockchain storage (MAX 1KB)
 */
export interface IntelReportMetadata {
  // Core identification
  id: string;
  title: string; // Max 100 chars
  version: string;
  
  // Lightweight content (blockchain-safe)
  summary: string; // Max 300 chars
  confidence: number; // 0.0-1.0
  
  // Geographic (required for blockchain)
  latitude: number;
  longitude: number;
  
  // Temporal
  timestamp: number; // Unix timestamp
  author: string; // Wallet address
  
  // References to heavy content
  dataPackHash: string; // SHA-256 of associated DataPack
  ipfsHash?: string; // IPFS content hash
  
  // Marketplace
  tags: string[]; // Max 10 tags, 20 chars each
}

/**
 * Full intelligence report data model (unlimited size)
 */
export interface IntelReportData {
  // From metadata (duplicated for standalone use)
  id: string;
  title: string;
  summary: string;
  confidence: number;
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string;
  tags: string[];
  
  // Full content (not stored on blockchain)
  content: string; // Unlimited markdown content
  keyFindings: string[];
  recommendations: string[];
  sources: IntelSource[];
  entities: IntelEntity[];
  relationships: IntelRelationship[];
  evidence: Evidence[];
  
  // UI-specific fields
  subtitle?: string;
  date?: string; // ISO string for display
  categories?: string[];
  metaDescription?: string;
  
  // Package references
  packageId?: string;
  dataPackHash?: string;
  
  // Blockchain compatibility fields
  pubkey?: string; // Solana account public key
  signature?: string; // Transaction signature
  
  // Legacy compatibility
  /** @deprecated Use latitude */
  lat?: number;
  /** @deprecated Use longitude */
  long?: number;
}

/**
 * Blockchain-safe structure (matches Anchor program exactly)
 */
export interface BlockchainIntelReport {
  title: string; // Max 100 chars
  content: string; // Max 500 chars (truncated summary)
  tags: string[]; // Max 5 tags
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string; // PublicKey base58
}

/**
 * Complete package container
 */
export interface IntelReportPackage {
  packageId: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  
  // Lightweight metadata (NFT storage)
  metadata: IntelReportMetadata;
  
  // Heavy content (off-chain storage)
  dataPack: IntelReportDataPack;
  
  // Security and access
  signature: PackageSignature;
  encryption?: PackageEncryption;
  accessControl: PackageAccessControl;
  
  // Distribution
  distribution: DistributionMetadata;
  marketplace?: MarketplaceMetadata;
}

/**
 * ==========================================
 * CONVERSION & COMPATIBILITY LAYER
 * ==========================================
 */

interface ExtractedContent {
  content: string;
  keyFindings: string[];
  recommendations: string[];
  sources: IntelSource[];
  entities: IntelEntity[];
  relationships: IntelRelationship[];
  evidence: Evidence[];
}

export class IntelReportConverter {
  /**
   * Convert full IntelReportData to blockchain-safe format
   * Handles truncation and field mapping
   */
  static toBlockchainFormat(data: IntelReportData): BlockchainIntelReport {
    return {
      title: this.truncateString(data.title, 100),
      content: this.truncateString(data.summary || data.content, 500),
      tags: data.tags.slice(0, 5), // Max 5 tags for blockchain
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: data.timestamp,
      author: data.author
    };
  }
  
  /**
   * Convert to lightweight metadata for NFT storage
   */
  static toMetadata(data: IntelReportData): IntelReportMetadata {
    return {
      id: data.id,
      title: this.truncateString(data.title, 100),
      version: '1.0.0',
      summary: this.truncateString(data.summary || data.content, 300),
      confidence: data.confidence,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: data.timestamp,
      author: data.author,
      dataPackHash: data.dataPackHash || '',
      ipfsHash: data.packageId,
      tags: data.tags.slice(0, 10).map(tag => this.truncateString(tag, 20))
    };
  }
  
  /**
   * Reconstruct full data from metadata + DataPack
   */
  static fromPackage(pkg: IntelReportPackage): IntelReportData {
    // Extract full content from DataPack
    const fullContent = this.extractContentFromDataPack(pkg.dataPack);
    
    return {
      // From metadata
      ...pkg.metadata,
      
      // From DataPack
      content: fullContent.content,
      keyFindings: fullContent.keyFindings,
      recommendations: fullContent.recommendations,
      sources: fullContent.sources,
      entities: fullContent.entities,
      relationships: fullContent.relationships,
      evidence: fullContent.evidence,
      
      // Package references
      packageId: pkg.packageId,
      dataPackHash: pkg.metadata.dataPackHash
    };
  }
  
  private static truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }
  
  private static extractContentFromDataPack(_dataPack: IntelReportDataPack): ExtractedContent {
    // TODO: Implement DataPack content extraction
    return {
      content: '',
      keyFindings: [],
      recommendations: [],
      sources: [],
      entities: [],
      relationships: [],
      evidence: []
    };
  }
}

/**
 * ==========================================
 * MEMORY & PERFORMANCE SAFEGUARDS
 * ==========================================
 */

export interface MemorySafetyConfig {
  maxPackageSize: number; // Bytes
  maxMemoryUsage: number; // Bytes
  enableStreaming: boolean;
  enableCompression: boolean;
  memoryPressureCallback?: () => void;
}

export class MemorySafetyManager {
  private static instance: MemorySafetyManager;
  private config: MemorySafetyConfig;
  private currentMemoryUsage = 0;
  
  constructor(config: MemorySafetyConfig) {
    this.config = config;
  }
  
  static getInstance(config?: MemorySafetyConfig): MemorySafetyManager {
    if (!this.instance) {
      this.instance = new MemorySafetyManager(config || {
        maxPackageSize: 50 * 1024 * 1024, // 50MB
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        enableStreaming: true,
        enableCompression: true
      });
    }
    return this.instance;
  }
  
  checkMemoryPressure(): boolean {
    return this.currentMemoryUsage > this.config.maxMemoryUsage;
  }
  
  validatePackageSize(size: number): boolean {
    return size <= this.config.maxPackageSize;
  }
  
  allocateMemory(size: number): boolean {
    if (this.currentMemoryUsage + size > this.config.maxMemoryUsage) {
      this.config.memoryPressureCallback?.();
      return false;
    }
    this.currentMemoryUsage += size;
    return true;
  }
  
  freeMemory(size: number): void {
    this.currentMemoryUsage = Math.max(0, this.currentMemoryUsage - size);
  }
}

/**
 * ==========================================
 * VERSION COMPATIBILITY LAYER
 * ==========================================
 */

export interface VersionInfo {
  dataPackVersion: string;
  packageVersion: string;
  architectureVersion: string;
}

export class VersionCompatibilityManager {
  private static supportedVersions = {
    dataPackVersion: ['1.0.0'],
    packageVersion: ['1.0.0'],
    architectureVersion: ['1.0.0']
  };
  
  static isCompatible(version: VersionInfo): boolean {
    return (
      this.supportedVersions.dataPackVersion.includes(version.dataPackVersion) &&
      this.supportedVersions.packageVersion.includes(version.packageVersion) &&
      this.supportedVersions.architectureVersion.includes(version.architectureVersion)
    );
  }
  
  static migrate(_data: unknown, _fromVersion: VersionInfo, _toVersion: VersionInfo): unknown {
    // TODO: Implement version migration logic
    return _data;
  }
}

/**
 * ==========================================
 * SUPPORTING TYPES
 * ==========================================
 */

export interface IntelSource {
  id: string;
  type: 'OSINT' | 'SIGINT' | 'HUMINT' | 'GEOINT' | 'FININT' | 'TECHINT';
  name: string;
  reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  url?: string;
  accessedAt: string;
}

export interface IntelEntity {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'location' | 'asset' | 'event' | 'technology';
  confidence: number;
  attributes: Record<string, unknown>;
}

export interface IntelRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'connected_to' | 'owns' | 'controls' | 'located_at' | 'works_for' | 'related_to';
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface Evidence {
  id: string;
  type: 'document' | 'image' | 'screenshot' | 'log' | 'scan_result';
  description: string;
  source: string;
  timestamp: string;
  content: string | object;
}

// Re-export from other files to maintain compatibility
export type {
  PackageSignature,
  PackageEncryption,
  PackageAccessControl,
  DistributionMetadata,
  MarketplaceMetadata
} from './IntelReportPackage';
