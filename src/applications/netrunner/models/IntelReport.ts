/**
 * NetRunner Intel Report Model
 * 
 * Defines the structure and functionality of Intel Reports within the NetRunner ecosystem.
 * This model bridges the gap between raw OSINT data and structured intelligence.
 * 
 * @author GitHub Copilot
 * @date July 18, 2025
 */

import { v4 as uuidv4 } from 'uuid';

export interface IntelEntity {
  id: string;
  type: 'person' | 'organization' | 'location' | 'asset' | 'event' | 'technology' | 'contact';
  name: string;
  description?: string;
  confidence: number;
  metadata: Record<string, unknown>;
  attributes: Record<string, unknown>;
  // Backwards compatibility for older adapters/tests
  properties?: Record<string, unknown>;
  relationships: IntelRelationship[];
}

export interface IntelRelationship {
  id: string;
  type: 'connected_to' | 'owns' | 'controls' | 'located_at' | 'works_for' | 'uses' | 'related_to';
  sourceId: string;
  targetId: string;
  confidence: number;
  metadata: Record<string, unknown>;
  /**
   * Deprecated aliases for backward compatibility with older adapters/tests.
   * Prefer using sourceId and targetId.
   */
  source?: string;
  target?: string;
}

export interface Evidence {
  id: string;
  type: 'document' | 'image' | 'screenshot' | 'log' | 'scan_result' | 'api_response';
  description: string;
  source: string;
  timestamp: Date;
  content: string | object;
  metadata: Record<string, unknown>;
}


export interface IntelReport {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  author: string;
  created: Date;
  updated: Date;
  version: string;
  
  // Geographic data
  latitude?: number;
  longitude?: number;
  location?: string;
  
  // Metadata (declassified build)
  tags: string[];
  categories: string[];
  confidence: number;
  
  // Content structure
  summary: string;
  content: string;
  keyFindings: string[];
  
  // Entities and relationships
  entities: IntelEntity[];
  relationships: IntelRelationship[];
  
  // Evidence and sources
  evidence: Evidence[];
  sources: string[];
  
  // Technical metadata
  metadata: {
    scanId?: string;
    targetUrl?: string;
    scanType?: string;
    processingTime?: number;
    dataSize?: number;
    qualityScore?: number;
    [key: string]: unknown;
  };
  
  // Status and workflow
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  workflow: {
    stage: string;
    assignee?: string;
    reviewers: string[];
    approvers: string[];
    comments: Array<{
      id: string;
      author: string;
      timestamp: Date;
      content: string;
      type: 'comment' | 'approval' | 'rejection';
    }>;
  };
}

export class IntelReportBuilder {
  private report: Partial<IntelReport>;

  constructor(title: string, author: string) {
    this.report = {
      id: uuidv4(),
      title,
      author,
      created: new Date(),
      updated: new Date(),
      version: '1.0.0',
      tags: [],
      categories: [],
      confidence: 0,
      summary: '',
      content: '',
      keyFindings: [],
      entities: [],
      relationships: [],
      evidence: [],
      sources: [],
      metadata: {},
      status: 'draft',
      workflow: {
        stage: 'initial',
        reviewers: [],
        approvers: [],
        comments: []
      }
    };
  }

  setDescription(description: string): this {
    this.report.description = description;
    return this;
  }

  setLocation(latitude: number, longitude: number, location?: string): this {
    this.report.latitude = latitude;
    this.report.longitude = longitude;
    this.report.location = location;
    return this;
  }

  // classification removed in civilian build

  addTag(tag: string): this {
    if (!this.report.tags) this.report.tags = [];
    if (!this.report.tags.includes(tag)) {
      this.report.tags.push(tag);
    }
    return this;
  }

  addCategory(category: string): this {
    if (!this.report.categories) this.report.categories = [];
    if (!this.report.categories.includes(category)) {
      this.report.categories.push(category);
    }
    return this;
  }

  setConfidence(confidence: number): this {
    this.report.confidence = Math.max(0, Math.min(1, confidence));
    return this;
  }

  setSummary(summary: string): this {
    this.report.summary = summary;
    return this;
  }

  setContent(content: string): this {
    this.report.content = content;
    return this;
  }

  addKeyFinding(finding: string): this {
    if (!this.report.keyFindings) this.report.keyFindings = [];
    this.report.keyFindings.push(finding);
    return this;
  }

  addEntity(entity: IntelEntity): this {
    if (!this.report.entities) this.report.entities = [];
    this.report.entities.push(entity);
    return this;
  }

  addRelationship(relationship: IntelRelationship): this {
    if (!this.report.relationships) this.report.relationships = [];
    this.report.relationships.push(relationship);
    return this;
  }

  addEvidence(evidence: Evidence): this {
    if (!this.report.evidence) this.report.evidence = [];
    this.report.evidence.push(evidence);
    return this;
  }

  addSource(source: string): this {
    if (!this.report.sources) this.report.sources = [];
    if (!this.report.sources.includes(source)) {
      this.report.sources.push(source);
    }
    return this;
  }

  setMetadata(key: string, value: unknown): this {
    if (!this.report.metadata) this.report.metadata = {};
    this.report.metadata[key] = value;
    return this;
  }

  setStatus(status: IntelReport['status']): this {
    this.report.status = status;
    return this;
  }

  build(): IntelReport {
    // Validate required fields
    if (!this.report.title) {
      throw new Error('Intel Report title is required');
    }
    if (!this.report.author) {
      throw new Error('Intel Report author is required');
    }
    if (!this.report.description) {
      throw new Error('Intel Report description is required');
    }

    // Update the updated timestamp
    this.report.updated = new Date();

    return this.report as IntelReport;
  }
}
