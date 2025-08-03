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
    return {
      id: data.id || data.pubkey || 'unknown',
      title: data.title,
      classification: data.classification,
      source: data.author,
      timestamp: new Date(data.timestamp * 1000), // Convert from Unix timestamp
      location: {
        lat: data.latitude,
        lng: data.longitude,
        altitude: data.location3D?.altitude
      },
      content: {
        summary: data.content,
        details: data.content,
        keywords: data.tags
      },
      metadata: {
        category: data.categories?.[0],
        tags: data.tags,
        confidence: data.confidence,
        priority: data.priority
      },
      visualization: this.createVisualization3D(data),
      lodLevel: this.determineLODLevel(data),
      contextVisible: true
    };
  }

  /**
   * Transform IntelReportData to IntelRender3D for Globe.gl rendering
   */
  static toRender3D(data: IntelReportData): IntelRender3D {
    const vis = this.createVisualization3D(data);
    
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
  private static createVisualization3D(data: IntelReportData): IntelVisualization3D {
    // Use existing 3D visualization or create default
    if (data.visualization3D) {
      return data.visualization3D;
    }

    return {
      markerType: this.determineMarkerType(data),
      color: this.getClassificationColor(data.classification),
      size: this.getPrioritySize(data.priority),
      opacity: 0.8,
      priority: this.mapPriority(data.priority),
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
    if (data.classification && ['SECRET', 'TOP_SECRET'].includes(data.classification)) {
      return 'classified';
    }
    
    if (data.priority === 'IMMEDIATE') {
      return 'priority';
    }
    
    if (data.confidence && data.confidence > 85) {
      return 'verified';
    }
    
    if (data.confidence && data.confidence < 60) {
      return 'unverified';
    }
    
    return 'standard';
  }

  /**
   * Get color based on classification level
   */
  private static getClassificationColor(classification?: string): string {
    switch (classification) {
      case 'TOP_SECRET':
        return '#ff0000'; // Red
      case 'SECRET':
        return '#ff8c00'; // Dark orange
      case 'CONFIDENTIAL':
        return '#ffd700'; // Gold
      case 'CUI':
        return '#87ceeb'; // Sky blue
      case 'UNCLASS':
      default:
        return '#00ff00'; // Green
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
    
    // Classified reports get medium detail
    if (data.classification && data.classification !== 'UNCLASS') {
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
}
