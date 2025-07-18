// Unified Intelligence Report Data Model
// This model serves as the single source of truth for all intelligence report data
// across blockchain, UI, and service layers

import { PrimaryIntelSource } from './Intel/Sources';
import { ClassificationLevel } from './Intel/Classification';

/**
 * Core Intelligence Report Data Structure
 * This interface represents the complete data model for intelligence reports
 * across all layers of the application.
 * 
 * Note: This is a "Report" which contains processed intelligence, not raw intel.
 * For raw intel data, see the Intel interface in ./intelligence/Intel.ts
 */
export interface IntelReportData {
  // Unique identifier (account public key or generated ID)
  id?: string;
  
  // Blockchain fields (required for on-chain storage)
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string; // Wallet address (base58)
  
  // Intelligence-specific fields
  classification?: ClassificationLevel;
  sources?: PrimaryIntelSource[]; // What types of intel sources contributed
  confidence?: number; // 0-100 confidence in the report
  priority?: 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE';
  
  // Blockchain metadata (available after submission)
  pubkey?: string; // Solana account public key (base58)
  signature?: string; // Transaction signature
  
  // UI-specific fields (optional, used for display)
  subtitle?: string;
  date?: string; // ISO date string for display
  categories?: string[];
  metaDescription?: string;
  
  // Legacy compatibility fields (deprecated, use latitude/longitude)
  /** @deprecated Use latitude instead */
  lat?: number;
  /** @deprecated Use longitude instead */
  long?: number;
}

/**
 * Form Data for Intel Report Creation
 * Used by UI components for form handling
 */
export interface IntelReportFormData {
  title: string;
  subtitle: string;
  content: string;
  tags: string; // Comma-separated string
  categories: string; // Comma-separated string
  lat: string; // String representation for form inputs
  long: string; // String representation for form inputs
  date: string; // ISO date string
  author: string;
  metaDescription: string;
}

/**
 * Blockchain-specific Intel Report
 * Matches the Anchor program struct exactly
 */
export interface BlockchainIntelReport {
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp as BN
  author: string; // PublicKey as base58 string
}

/**
 * UI Overlay Marker for Globe/Map Display
 * Used by visualization components
 */
export interface IntelReportOverlayMarker {
  pubkey: string;
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string;
}

/**
 * Data Transformation Utilities
 */
export class IntelReportTransformer {
  /**
   * Convert form data to blockchain data
   */
  static formToBlockchain(form: IntelReportFormData): BlockchainIntelReport {
    return {
      title: form.title.trim(),
      content: form.content.trim(),
      tags: form.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
      latitude: parseFloat(form.lat) || 0,
      longitude: parseFloat(form.long) || 0,
      timestamp: form.date ? new Date(form.date).getTime() : Date.now(),
      author: form.author.trim(),
    };
  }

  /**
   * Convert blockchain data to unified data model
   */
  static blockchainToData(
    blockchain: BlockchainIntelReport,
    pubkey?: string,
    signature?: string
  ): IntelReportData {
    return {
      title: blockchain.title,
      content: blockchain.content,
      tags: blockchain.tags,
      latitude: blockchain.latitude,
      longitude: blockchain.longitude,
      timestamp: blockchain.timestamp,
      author: blockchain.author,
      pubkey,
      signature,
      // Generate display fields
      date: new Date(blockchain.timestamp).toISOString().split('T')[0],
      metaDescription: blockchain.content.substring(0, 100) + '...',
      // Legacy compatibility
      lat: blockchain.latitude,
      long: blockchain.longitude,
    };
  }

  /**
   * Convert unified data to overlay marker
   */
  static dataToOverlayMarker(data: IntelReportData): IntelReportOverlayMarker {
    return {
      pubkey: data.pubkey || '',
      title: data.title,
      content: data.content,
      tags: data.tags,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: data.timestamp,
      author: data.author,
    };
  }

  /**
   * Validate intel report data
   */
  static validate(data: Partial<IntelReportData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Title is required');
    }

    if (!data.content?.trim()) {
      errors.push('Content is required');
    }

    if (!data.tags?.length) {
      errors.push('At least one tag is required');
    }

    if (typeof data.latitude !== 'number' || isNaN(data.latitude)) {
      errors.push('Valid latitude is required');
    }

    if (typeof data.longitude !== 'number' || isNaN(data.longitude)) {
      errors.push('Valid longitude is required');
    }

    if (!data.author?.trim()) {
      errors.push('Author is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Legacy IntelReport class for backward compatibility
 * @deprecated Use IntelReportData interface instead
 */
export class IntelReport {
  constructor(
    public lat: number,
    public long: number,
    public title: string,
    public subtitle: string,
    public date: string,
    public author: string,
    public content: string,
    public tags: string[],
    public categories: string[],
    public metaDescription: string
  ) {}

  /**
   * Convert to new unified data model
   */
  toData(): IntelReportData {
    return {
      title: this.title,
      content: this.content,
      tags: this.tags,
      latitude: this.lat,
      longitude: this.long,
      timestamp: this.date ? new Date(this.date).getTime() : Date.now(),
      author: this.author,
      subtitle: this.subtitle,
      date: this.date,
      categories: this.categories,
      metaDescription: this.metaDescription,
      // Legacy compatibility
      lat: this.lat,
      long: this.long,
    };
  }
}
