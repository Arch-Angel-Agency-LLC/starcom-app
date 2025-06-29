/**
 * Legacy Type Compatibility Layer
 * 
 * This module provides utilities to bridge legacy Intel Report types
 * with the new IntelReports3D types, ensuring smooth migration.
 */

import type { IntelReport3DData } from '../types/intelligence/IntelReportTypes';
import type { IntelReportData } from '../models/IntelReportData';
import type { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';

/**
 * Maps legacy IntelReportOverlayMarker to new IntelReport3DData format
 */
export const mapLegacyMarkerToReport3D = (marker: IntelReportOverlayMarker): IntelReport3DData => {
  return {
    id: marker.pubkey || `marker-${Date.now()}`,
    title: marker.title || 'Untitled Report',
    classification: mapLegacyClassification(marker.tags),
    source: marker.author || 'Unknown',
    timestamp: new Date(marker.timestamp || Date.now()),
    
    // Geospatial location
    location: {
      lat: marker.latitude || 0,
      lng: marker.longitude || 0,
      altitude: 0,
      accuracy: 10,
      region: 'Unknown'
    },
    
    // Content data
    content: {
      summary: marker.content || '',
      details: marker.content || '',
      keywords: marker.tags || [],
      analysis: '',
      recommendations: []
    },
    
    // 3D visualization properties
    visualization: {
      color: getColorFromClassification(mapLegacyClassification(marker.tags)),
      size: getSizeFromPriority(mapLegacyPriority(marker.tags)),
      shape: 'sphere',
      opacity: 0.8,
      animation: {
        type: 'pulse',
        duration: 2000,
        enabled: true
      }
    },
    
    // Metadata for analysis and filtering
    metadata: {
      priority: mapLegacyPriority(marker.tags),
      category: mapLegacyCategory(marker.tags),
      confidence: 85,
      verified: false,
      analyst: marker.author || 'Unknown',
      created: new Date(marker.timestamp || Date.now()),
      modified: new Date(marker.timestamp || Date.now()),
      version: 1,
      status: 'active',
      tags: marker.tags || []
    }
  };
};

/**
 * Maps legacy IntelReportData to new IntelReport3DData format
 */
export const mapLegacyDataToReport3D = (data: IntelReportData): IntelReport3DData => {
  return {
    id: data.pubkey || `data-${Date.now()}`,
    title: data.title || 'Untitled Report',
    content: data.content || '',
    classification: data.classification || 'UNCLASSIFIED',
    priority: data.priority || 'MEDIUM',
    category: data.category || 'GENERAL',
    tags: data.tags || [],
    timestamp: new Date(data.timestamp || Date.now()),
    confidence: data.confidence || 75,
    source: data.author || 'Unknown',
    
    location: {
      coordinates: {
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        altitude: data.altitude || 0
      },
      address: data.address || '',
      region: data.region || '',
      type: 'point'
    },
    
    visualization: {
      color: getColorFromClassification(data.classification || 'UNCLASSIFIED'),
      size: getSizeFromPriority(data.priority || 'MEDIUM'),
      shape: 'sphere',
      opacity: 0.8,
      animation: {
        type: 'pulse',
        speed: 1.0,
        enabled: true
      }
    },
    
    metadata: {
      version: '1.0',
      created: new Date(data.timestamp || Date.now()),
      modified: new Date(data.timestamp || Date.now()),
      author: data.author || 'Unknown',
      editor: null,
      attachments: [],
      references: [],
      geotags: [{
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        timestamp: new Date(data.timestamp || Date.now())
      }]
    }
  };
};

/**
 * Maps legacy classification from tags
 */
function mapLegacyClassification(tags: string[]): 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' {
  if (tags.some(tag => tag.toLowerCase().includes('top_secret') || tag.toLowerCase().includes('ts'))) {
    return 'TOP_SECRET';
  }
  if (tags.some(tag => tag.toLowerCase().includes('secret'))) {
    return 'SECRET';
  }
  if (tags.some(tag => tag.toLowerCase().includes('confidential'))) {
    return 'CONFIDENTIAL';
  }
  return 'UNCLASSIFIED';
}

/**
 * Maps legacy priority from tags
 */
function mapLegacyPriority(tags: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (tags.some(tag => tag.toLowerCase().includes('critical') || tag.toLowerCase().includes('urgent'))) {
    return 'CRITICAL';
  }
  if (tags.some(tag => tag.toLowerCase().includes('high') || tag.toLowerCase().includes('important'))) {
    return 'HIGH';
  }
  if (tags.some(tag => tag.toLowerCase().includes('low'))) {
    return 'LOW';
  }
  return 'MEDIUM';
}

/**
 * Maps legacy category from tags
 */
function mapLegacyCategory(tags: string[]): string {
  const categoryMap = {
    'sigint': 'SIGINT',
    'humint': 'HUMINT',
    'geoint': 'GEOINT',
    'osint': 'OSINT',
    'cyber': 'CYBER',
    'intel': 'INTEL'
  };
  
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerTag.includes(key)) {
        return value;
      }
    }
  }
  
  return 'GENERAL';
}

/**
 * Gets visualization color based on classification
 */
function getColorFromClassification(classification: string): string {
  switch (classification) {
    case 'TOP_SECRET':
      return '#ff4444'; // Red
    case 'SECRET':
      return '#ff8800'; // Orange
    case 'CONFIDENTIAL':
      return '#ffaa00'; // Yellow
    case 'UNCLASSIFIED':
    default:
      return '#00ff88'; // Green
  }
}

/**
 * Gets visualization size based on priority
 */
function getSizeFromPriority(priority: string): number {
  switch (priority) {
    case 'CRITICAL':
      return 1.5;
    case 'HIGH':
      return 1.2;
    case 'MEDIUM':
      return 1.0;
    case 'LOW':
    default:
      return 0.8;
  }
}

/**
 * Maps new IntelReport3DData back to legacy format for compatibility
 */
export const mapReport3DToLegacyMarker = (report: IntelReport3DData): IntelReportOverlayMarker => {
  return {
    pubkey: report.id,
    title: report.title,
    content: report.content,
    tags: report.tags,
    latitude: report.location.coordinates.latitude,
    longitude: report.location.coordinates.longitude,
    timestamp: report.timestamp.getTime(),
    author: report.source
  };
};

/**
 * Batch conversion utilities
 */
export const mapLegacyMarkersToReports3D = (markers: IntelReportOverlayMarker[]): IntelReport3DData[] => {
  return markers.map(mapLegacyMarkerToReport3D);
};

export const mapLegacyDataToReports3D = (data: IntelReportData[]): IntelReport3DData[] => {
  return data.map(mapLegacyDataToReport3D);
};

export const mapReports3DToLegacyMarkers = (reports: IntelReport3DData[]): IntelReportOverlayMarker[] => {
  return reports.map(mapReport3DToLegacyMarker);
};

/**
 * Type guards for migration
 */
export const isLegacyMarker = (data: any): data is IntelReportOverlayMarker => {
  return (
    data &&
    typeof data.pubkey === 'string' &&
    typeof data.title === 'string' &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number'
  );
};

export const isLegacyData = (data: any): data is IntelReportData => {
  return (
    data &&
    typeof data.title === 'string' &&
    typeof data.content === 'string' &&
    (data.latitude !== undefined || data.longitude !== undefined)
  );
};

export const isReport3D = (data: any): data is IntelReport3DData => {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    data.location &&
    data.visualization &&
    data.metadata
  );
};
