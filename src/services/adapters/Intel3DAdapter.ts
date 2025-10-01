/**
 * Intel 3D Adapter Service
 * 
 * Clean transformation service that converts standard IntelReportData
 * to 3D visualization data for Intel Reports 3D components.
 */

import type { IntelReportData } from '../../models/IntelReportData';
import type { 
  IntelReport3DData, 
  IntelVisualization3D, 
  IntelRender3D,
  IntelLODLevel 
} from '../../models/Intel/IntelVisualization3D';
import type { IntelLocation } from '../../models/Intel/IntelLocation';
import type { 
  IntelPriority, 
  IntelMarkerType
} from '../../models/Intel/IntelEnums';

/**
 * Intel 3D Adapter Service
 * Transforms IntelReportData to 3D visualization formats
 */
export class Intel3DAdapter {
  
  /**
   * Transform IntelReportData to IntelReport3DData for 3D visualization
   */
  static toIntelReport3D(data: IntelReportData): IntelReport3DData {
    const priorityEnum = this.mapPriority(data.priority);
    const timestampMs = this.normalizeTimestamp(data.timestamp);
    const normalizedConfidence = this.normalizeConfidence(data.confidence);
    const tags = data.tags ?? [];

    const location = typeof data.latitude === 'number' && typeof data.longitude === 'number'
      ? {
          lat: data.latitude,
          lng: data.longitude,
          altitude: data.location3D?.altitude,
          region: data.location3D?.region
        }
      : undefined;

    return {
      id: data.id || data.pubkey || 'unknown',
      title: data.title,
      source: data.author,
      timestamp: new Date(timestampMs),
      location,
      content: {
        summary: data.content,
        details: data.content,
        keywords: tags
      },
      metadata: {
        category: data.categories?.[0],
        tags,
        confidence: normalizedConfidence,
        reliability: this.mapReliability(data.reliability),
        freshness: this.calculateFreshness(timestampMs),
        priority: priorityEnum,
        threat_level: this.mapPriorityToThreat(priorityEnum)
      },
      visualization: this.createVisualization3D(data, priorityEnum),
      lodLevel: this.determineLODLevel(data),
      contextVisible: true
    };
  }

  /**
   * Transform IntelReportData to IntelRender3D for Globe.gl rendering
   */
  static toRender3D(data: IntelReportData): IntelRender3D {
    const priorityEnum = this.mapPriority(data.priority);
    const vis = this.createVisualization3D(data, priorityEnum);
    
    return {
      id: data.id || data.pubkey || 'unknown',
      position: [
        data.longitude, 
        data.latitude, 
        data.location3D?.altitude || 0
      ],
      visible: true,
      scale: vis.size,
      rotation: [0, 0, 0],
      color: vis.color,
      opacity: vis.opacity,
      zIndex: this.getPriorityZIndex(vis.priority)
    };
  }

  /**
   * Create 3D visualization properties from report data
   */
  private static createVisualization3D(data: IntelReportData, priorityEnum: IntelPriority): IntelVisualization3D {
    // Use existing 3D visualization or create default
    if (data.visualization3D) {
      return data.visualization3D;
    }

    return {
      markerType: this.determineMarkerType(data),
      color: this.getPriorityColor(data.priority),
      size: this.getPrioritySize(data.priority),
      opacity: 0.8,
      priority: priorityEnum,
      icon: this.getMarkerIcon(data),
      label: {
        text: data.title,
        visible: false,
        position: 'top',
        fontSize: 12,
        color: '#ffffff'
      },
      animation: {
        enabled: this.shouldAnimate(data.priority),
        type: 'pulse',
        duration: 2000,
        loop: true
      }
    };
  }

  /**
   * Determine marker type based on report data
   */
  private static determineMarkerType(data: IntelReportData): IntelMarkerType {
    if (data.priority === 'IMMEDIATE') {
      return 'priority';
    }

    const confidence = this.normalizeConfidence(data.confidence);

    if (confidence !== undefined && confidence >= 0.85) {
      return 'verified';
    }

    if (confidence !== undefined && confidence <= 0.5) {
      return 'unverified';
    }
    
    return 'standard';
  }

  /**
   * Get color based on priority level
   */
  private static getPriorityColor(priority?: string): string {
    switch (priority) {
      case 'IMMEDIATE':
        return '#ff3b30'; // Red for urgent reports
      case 'PRIORITY':
        return '#ff9500'; // Orange for high priority
      case 'ROUTINE':
      default:
        return '#34c759'; // Green for routine reports
    }
  }

  /**
   * Get marker size based on priority
   */
  private static getPrioritySize(priority?: string): number {
    switch (priority) {
      case 'IMMEDIATE':
        return 1.5;
      case 'PRIORITY':
        return 1.2;
      case 'ROUTINE':
      default:
        return 1.0;
    }
  }

  /**
   * Map legacy priority to new enum
   */
  private static mapPriority(priority?: string): IntelPriority {
    switch (priority) {
      case 'IMMEDIATE':
        return 'critical';
      case 'PRIORITY':
        return 'high';
      case 'ROUTINE':
      default:
        return 'medium';
    }
  }

  /**
   * Get Z-index based on priority for proper layering
   */
  private static getPriorityZIndex(priority: IntelPriority): number {
    switch (priority) {
      case 'critical':
        return 1000;
      case 'high':
        return 800;
      case 'medium':
        return 600;
      case 'low':
        return 400;
      case 'background':
        return 200;
      default:
        return 500;
    }
  }

  /**
   * Determine if marker should animate based on priority
   */
  private static shouldAnimate(priority?: string): boolean {
    return priority === 'IMMEDIATE';
  }

  /**
   * Get marker icon based on report data
   */
  private static getMarkerIcon(data: IntelReportData): string | undefined {
    // Use categories or tags to determine icon
    const categories = data.categories || [];
    const tags = data.tags || [];
    const allKeywords = [...categories, ...tags].map(k => k.toLowerCase());

    if (allKeywords.some(k => k.includes('cyber') || k.includes('hack'))) {
      return 'cyber';
    }
    
    if (allKeywords.some(k => k.includes('threat') || k.includes('danger'))) {
      return 'threat';
    }
    
    if (allKeywords.some(k => k.includes('financial') || k.includes('money'))) {
      return 'financial';
    }
    
    return undefined; // Use default marker
  }

  /**
   * Determine level of detail for performance optimization
   */
  private static determineLODLevel(data: IntelReportData): IntelLODLevel {
    // Priority reports get high detail
    if (data.priority === 'IMMEDIATE') {
      return 'high';
    }

    if (data.priority === 'PRIORITY') {
      return 'medium';
    }

    return 'medium'; // Default level
  }

  /**
   * Create IntelLocation from report coordinates
   */
  static createLocation3D(data: IntelReportData): IntelLocation {
    return {
      lat: data.latitude,
      lng: data.longitude,
      altitude: data.location3D?.altitude,
      accuracy: data.location3D?.accuracy,
      region: data.location3D?.region,
      timezone: data.location3D?.timezone
    };
  }

  /**
   * Batch transform multiple reports for performance
   */
  static batchToRender3D(reports: IntelReportData[]): IntelRender3D[] {
    return reports.map(report => this.toRender3D(report));
  }

  /**
   * Transform batch with LOD filtering for performance
   */
  static batchToRender3DWithLOD(
    reports: IntelReportData[], 
    maxVisible: number = 1000
  ): IntelRender3D[] {
    // Sort by priority and take top N
    const sorted = reports.sort((a, b) => {
      const aPriority = this.mapPriority(a.priority);
      const bPriority = this.mapPriority(b.priority);
      return this.getPriorityZIndex(bPriority) - this.getPriorityZIndex(aPriority);
    });

    return sorted
      .slice(0, maxVisible)
      .map(report => this.toRender3D(report));
  }

  private static mapReliability(reliability?: string): number | undefined {
    if (!reliability) return undefined;
    const map: Record<string, number> = {
      A: 1.0,
      B: 0.9,
      C: 0.75,
      D: 0.6,
      E: 0.45,
      F: 0.3
    };
    const normalized = map[reliability.toUpperCase()] ?? undefined;
    return normalized;
  }

  private static calculateFreshness(timestampMs?: number): number | undefined {
    if (!timestampMs) return undefined;
    const ageHours = (Date.now() - timestampMs) / (1000 * 60 * 60);
    if (ageHours <= 1) return 1;
    if (ageHours <= 6) return 0.9;
    if (ageHours <= 24) return 0.75;
    if (ageHours <= 72) return 0.6;
    if (ageHours <= 168) return 0.4;
    return 0.2;
  }

  private static mapPriorityToThreat(priority: IntelPriority): string {
    switch (priority) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'moderate';
      case 'low':
        return 'low';
      case 'background':
      default:
        return 'minimal';
    }
  }

  private static normalizeTimestamp(timestamp?: number): number {
    if (!timestamp) {
      return Date.now();
    }

    // If timestamp looks like seconds (10 digits), convert to ms
    if (timestamp < 1e12) {
      return timestamp * 1000;
    }

    return timestamp;
  }

  private static normalizeConfidence(confidence?: number): number | undefined {
    if (confidence === undefined) {
      return undefined;
    }

    if (confidence > 1) {
      return Math.min(confidence / 100, 1);
    }

    if (confidence < 0) {
      return undefined;
    }

    return confidence;
  }
}
