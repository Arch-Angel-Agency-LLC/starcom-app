// Unified Intelligence Report Model
// This is the single source of truth for all IntelReport interfaces across the application
// Consolidates fragmented implementations from various components and services

import { IntelCategory, IntelPriority, IntelThreatLevel, IntelClassification } from './IntelEnums';
import { IntelVisualization3D } from './IntelVisualization3D';
import { IntelLocation } from './IntelLocation';
// Canonical UI model import (migration target)
// NOTE: LegacyIntelReport retained temporarily (Phase 4 -> 5). Will be removed in Phase 5 cleanup.

// =============================================================================
// CORE UNIFIED INTEL REPORT INTERFACE
// =============================================================================

/**
 * Unified Intelligence Report Interface
 * This interface consolidates all fragmented IntelReport patterns found across:
 * - /src/services/IntelReportVisualizationService.ts
 * - /src/components/IntelAnalyzer/IntelReportsViewer.tsx
 * - /src/applications/netrunner/models/IntelReport.ts
 * - /src/services/data-management/providers/IntelDataProvider.ts
 * - And many other locations with duplicate interfaces
 */
/**
 * @deprecated Legacy aggregated IntelReport interface. Use IntelReportUI (src/types/intel/IntelReportUI)
 * and central services (intelReportService + provider) instead. This file is retained only for
 * historical architecture references and will be removed in Phase 5 cleanup.
 * eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy shape
 */
/**
 * @deprecated Replaced by IntelReportUI. This placeholder intentionally trimmed to minimal surface.
 * Remove in Phase 5 once all downstream imports migrate to IntelReportUI.
 */
export interface LegacyIntelReport {
  // =============================================================================
  // CORE IDENTIFICATION
  // =============================================================================
  
  /** Unique identifier */
  id: string; // retained for transitional mapping
  title: string;
  content: string;
  summary?: string;
  description?: string;
  subtitle?: string; // legacy field referenced by adapters
  
  // =============================================================================
  // AUTHORSHIP & METADATA
  // =============================================================================
  
  /** Report author (wallet address, agent ID, or name) */
  author: string;
  created: Date;
  updated: Date;
  version?: string;
  
  // =============================================================================
  // GEOGRAPHIC DATA
  // =============================================================================
  
  /** Primary latitude coordinate */
  latitude: number;
  longitude: number;
  
  /** Human-readable location description */
  location?: string;
  
  /** Advanced 3D location data (optional) */
  location3D?: IntelLocation;
  
  // =============================================================================
  // SECURITY & PRIORITIZATION
  // =============================================================================
  
  /** Optional informational security designation (declassified build) */
  classification?: IntelClassification;
  priority?: IntelPriority | 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE';
  threatLevel?: IntelThreatLevel;
  confidence: number;
  
  // =============================================================================
  // CATEGORIZATION & TAGGING
  // =============================================================================
  
  /** Report category */
  category?: IntelCategory;
  categories?: string[];
  tags: string[];
  
  /** Report type classification */
  type?: 'report' | 'analysis' | 'entity' | 'connection' | 'hypothesis' | 'intelligence' | 'assessment';
  
  // =============================================================================
  // INTELLIGENCE STRUCTURE
  // =============================================================================
  
  /** Key findings from the analysis */
  keyFindings?: string[];
  
  /** Intelligence source types that contributed (normalized to strings for compatibility) */
  sources?: string[];
  
  /** Source summary description */
  sourceSummary?: string;
  
  /** Related report connections */
  connections?: string[]; // IDs of connected reports
  
  /** Related reports */
  relatedReports?: string[];
  
  // =============================================================================
  // WORKFLOW & STATUS
  // =============================================================================
  
  /** Current report status */
  status?: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  
  /** Workflow information */
  workflow?: {
    stage: string;
    assignee?: string;
    reviewers: string[];
    approvals?: Array<{
      reviewer: string;
      approved: boolean;
      timestamp: Date;
      comments?: string;
    }>;
  };
  
  // =============================================================================
  // BLOCKCHAIN INTEGRATION
  // =============================================================================
  
  /** Solana account public key (base58) */
  pubkey?: string;
  signature?: string;
  timestamp?: number;
  verified?: boolean;
  
  // =============================================================================
  // 3D VISUALIZATION (FROM PHASE 1.5)
  // =============================================================================
  
  /** 3D visualization properties (optional) */
  visualization3D?: IntelVisualization3D;
  
  // =============================================================================
  // TECHNICAL METADATA
  // =============================================================================
  
  /** Extended technical metadata */
  metadata?: Record<string, unknown>;
  
  // =============================================================================
  // UI DISPLAY FIELDS
  // =============================================================================
  
  /** ISO date string for display */
  date?: string;
  
  /** Meta description for UI components */
  metaDescription?: string;
  
  // =============================================================================
  // LEGACY COMPATIBILITY
  // =============================================================================
  
  /** @deprecated Use latitude instead */
  lat?: number; // legacy alias
  long?: number; // legacy alias
}

// =============================================================================
// SUPPORTING INTERFACES
// =============================================================================

/**
 * Intel Entity (from NetRunner model)
 */
export interface IntelEntity {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'location' | 'asset' | 'event' | 'technology';
  confidence: number;
  attributes: Record<string, unknown>;
}

/**
 * Intel Relationship (from NetRunner model)
 */
export interface IntelRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'connected_to' | 'owns' | 'controls' | 'located_at' | 'works_for' | 'related_to';
  confidence: number;
  metadata: Record<string, unknown>;
}

/**
 * Evidence supporting the intel report
 */
export interface Evidence {
  id: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'data' | 'testimony';
  source: string;
  description: string;
  reliability: number;
  metadata: Record<string, unknown>;
}

// =============================================================================
// TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Intel Report Builder
 * Provides a fluent interface for creating Intel Reports
 */
/**
 * @deprecated Builder retained only for transitional adapter paths. Prefer CreateIntelReportInput helpers.
 */
export class IntelReportBuilder {
  private report: Partial<LegacyIntelReport>;

  constructor(title: string, author: string) {
  this.report = { id: crypto.randomUUID(), title, author, created: new Date(), updated: new Date(), version: '1.0.0', confidence: 0, tags: [], latitude: 0, longitude: 0, content: '' };
  }

  setId(id: string): this {
    this.report.id = id;
    return this;
  }

  setSubtitle(subtitle: string): this {
    this.report.subtitle = subtitle;
    return this;
  }

  setContent(content: string): this {
    this.report.content = content;
    return this;
  }

  setSummary(summary: string): this {
    this.report.summary = summary;
    return this;
  }

  setDescription(description: string): this {
    this.report.description = description;
    return this;
  }

  setLocation(latitude: number, longitude: number, location?: string): this {
    this.report.latitude = latitude;
    this.report.longitude = longitude;
    if (location) this.report.location = location;
    return this;
  }

  setClassification(level: IntelClassification): this {
    this.report.classification = level;
    return this;
  }

  setPriority(priority: IntelPriority | 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE'): this {
    this.report.priority = priority;
    return this;
  }

  setThreatLevel(threatLevel: IntelThreatLevel): this {
    this.report.threatLevel = threatLevel;
    return this;
  }

  setConfidence(confidence: number): this {
    this.report.confidence = Math.max(0, Math.min(100, confidence));
    return this;
  }

  setCategory(category: IntelCategory): this {
    this.report.category = category;
    return this;
  }

  addCategory(category: string): this {
    if (!this.report.categories) this.report.categories = [];
    if (!this.report.categories.includes(category)) {
      this.report.categories.push(category);
    }
    return this;
  }

  addTag(tag: string): this {
    if (!this.report.tags!.includes(tag)) {
      this.report.tags!.push(tag);
    }
    return this;
  }

  setType(type: LegacyIntelReport['type']): this {
    this.report.type = type;
    return this;
  }

  addKeyFinding(finding: string): this {
    if (!this.report.keyFindings) this.report.keyFindings = [];
    this.report.keyFindings.push(finding);
    return this;
  }

  addSource(source: string): this {
    if (!this.report.sources) this.report.sources = [];
    const normalized = String(source);
    if (!this.report.sources.includes(normalized)) {
      this.report.sources.push(normalized);
    }
    return this;
  }

  addConnection(reportId: string): this {
    if (!this.report.connections) this.report.connections = [];
    if (!this.report.connections.includes(reportId)) {
      this.report.connections.push(reportId);
    }
    return this;
  }

  setStatus(status: LegacyIntelReport['status']): this {
    this.report.status = status;
    return this;
  }

  setBlockchainData(pubkey: string, signature?: string, timestamp?: number): this {
    this.report.pubkey = pubkey;
    if (signature) this.report.signature = signature;
    if (timestamp) this.report.timestamp = timestamp;
    return this;
  }

  setVisualization3D(visualization: IntelVisualization3D): this {
    this.report.visualization3D = visualization;
    return this;
  }

  setLocation3D(location: IntelLocation): this {
    this.report.location3D = location;
    return this;
  }

  setMetadata(metadata: LegacyIntelReport['metadata']): this {
    this.report.metadata = { ...this.report.metadata, ...metadata };
    return this;
  }

  setDate(date: string): this {
    this.report.date = date;
    return this;
  }

  setMetaDescription(metaDescription: string): this {
    this.report.metaDescription = metaDescription;
    return this;
  }

  build(): LegacyIntelReport {
    // Validate required fields
  if (!this.report.id || !this.report.title || !this.report.author || !this.report.content) {
      throw new Error('IntelReport missing required fields: id, title, author, content');
    }

    // Set updated timestamp
    this.report.updated = new Date();

  return this.report as LegacyIntelReport;
  }
}

// =============================================================================
// COMPATIBILITY ADAPTERS
// =============================================================================

/**
 * IntelReport Compatibility Adapter
 * Converts between different IntelReport interface patterns
 */
export class IntelReportAdapter {
  /**
   * Convert IntelReportData to unified IntelReport
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromIntelReportData(data: any): LegacyIntelReport {
    return new IntelReportBuilder(data.title, data.author)
      .setId(data.id || data.pubkey || crypto.randomUUID())
      .setContent(data.content)
      .setSubtitle(data.subtitle)
      .setSummary(data.summary)
      .setLocation(data.latitude, data.longitude)
  .setClassification((data.classification as IntelClassification) || 'UNCLASSIFIED')
      .setPriority(data.priority)
      .setConfidence(data.confidence || 50)
      .setCategory(data.category)
      .setType('report')
      .setBlockchainData(data.pubkey, data.signature, data.timestamp)
      .setVisualization3D(data.visualization3D)
      .setLocation3D(data.location3D)
      .setDate(data.date)
      .setMetaDescription(data.metaDescription)
      .build();
  }

  /**
   * Convert Service Provider IntelReport to unified IntelReport
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromServiceProviderIntelReport(provider: any): LegacyIntelReport {
    return new IntelReportBuilder(provider.title, provider.author)
      .setId(provider.pubkey || crypto.randomUUID())
      .setContent(provider.content)
      .setLocation(provider.latitude, provider.longitude)
  .setClassification((provider.classification as IntelClassification) || 'UNCLASSIFIED')
      .setConfidence(provider.verified ? 90 : 50)
      .setBlockchainData(provider.pubkey, provider.signature, provider.timestamp)
      .build();
  }

  /**
   * Convert Analyzer IntelReport to unified IntelReport
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromAnalyzerIntelReport(analyzer: any): LegacyIntelReport {
    const builder = new IntelReportBuilder(analyzer.title, analyzer.metadata.author)
      .setId(analyzer.id)
      .setContent(analyzer.content)
      .setType(analyzer.type)
  .setClassification(analyzer.metadata.classification as IntelClassification)
      .setConfidence(analyzer.metadata.confidence);

    // Add tags
    analyzer.tags?.forEach((tag: string) => builder.addTag(tag));

    // Add connections
    analyzer.connections?.forEach((conn: string) => builder.addConnection(conn));

    return builder.build();
  }

  /**
   * Convert unified IntelReport back to IntelReportData format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toIntelReportData(report: LegacyIntelReport): any {
    return {
      id: report.id,
      title: report.title,
      content: report.content,
      tags: report.tags,
      latitude: report.latitude,
      longitude: report.longitude,
      timestamp: report.timestamp || Date.now(),
      author: report.author,
  classification: report.classification,
      sources: report.sources,
      confidence: report.confidence,
      priority: report.priority,
      pubkey: report.pubkey,
      signature: report.signature,
      subtitle: report.subtitle,
      date: report.date,
      categories: report.categories,
      metaDescription: report.metaDescription,
      visualization3D: report.visualization3D,
      location3D: report.location3D,
      lat: report.lat,
      long: report.long
    };
  }
}

// =============================================================================
// EXPORT TYPES FOR COMPATIBILITY
// =============================================================================

// Type alias for the most common usage pattern
export type { LegacyIntelReport as UnifiedIntelReport };
