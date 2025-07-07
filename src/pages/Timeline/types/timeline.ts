/**
 * Timeline Module TypeScript Type Definitions
 * Earth Alliance Cyber Investigation Suite
 */

// Timeline Event Types
export type TimelineEventType = 
  | 'intelligence'  // Intelligence report
  | 'action'        // Operational action
  | 'communication' // Communication event
  | 'transaction'   // Financial or blockchain transaction
  | 'alert'         // Security alert
  | 'news'          // News event
  | 'social'        // Social media activity
  | 'log';          // System log entry

// Timeline Event Severity
export type TimelineEventSeverity = 'low' | 'medium' | 'high' | 'critical';

// Timeline Event Source
export type TimelineEventSource = 
  | 'osint'         // Open-source intelligence
  | 'internal'      // Internal system
  | 'user'          // User-generated
  | 'blockchain'    // Blockchain data
  | 'social'        // Social media
  | 'darkweb'       // Dark web monitoring
  | 'external';     // External API

// Timeline Event Object
export interface TimelineEvent {
  id: string;                    // Unique event identifier
  title: string;                 // Event title
  description: string;           // Detailed description
  timestamp: string;             // ISO date string
  type: TimelineEventType;       // Event type
  source: TimelineEventSource;   // Event source
  severity: TimelineEventSeverity; // Event severity
  confidence: number;            // Confidence score (0-1)
  entities?: string[];           // Related entity IDs
  relatedEvents?: string[];      // Related event IDs
  location?: {                   // Optional location data
    coordinates?: [number, number]; // [longitude, latitude]
    name?: string;               // Location name
  };
  metadata?: Record<string, unknown>; // Additional metadata
  tags?: string[];               // Tags for filtering
  category?: string;             // Primary category
}

// Timeline Filter Options
export interface TimelineFilter {
  timeRange?: {
    start?: string;              // ISO date string
    end?: string;                // ISO date string
  };
  types?: TimelineEventType[];   // Filter by event types
  sources?: TimelineEventSource[]; // Filter by sources
  categories?: string[];         // Filter by categories
  entities?: string[];           // Filter by related entities
  severities?: TimelineEventSeverity[]; // Filter by severity
  tags?: string[];               // Filter by tags
  search?: string;               // Text search
  minConfidence?: number;        // Minimum confidence (0-1)
}

// Timeline Data Structure
export interface TimelineData {
  events: TimelineEvent[];       // Timeline events
  timeRange: {                   // Current time range
    start: string;               // ISO date string
    end: string;                 // ISO date string
  };
  categories: string[];          // Available categories
  types?: TimelineEventType[];   // Available event types
  sources?: TimelineEventSource[]; // Available sources
  tags?: string[];               // Available tags
}

// Event Correlation Result
export interface EventCorrelation {
  sourceEvent: TimelineEvent;    // The source event
  correlatedEvents: Array<{      // Correlated events
    event: TimelineEvent;        // The correlated event
    strength: number;            // Correlation strength (0-1)
    reason: string;              // Reason for correlation
  }>;
}

// Timeline View Options
export interface TimelineViewOptions {
  view: 'list' | 'calendar' | 'chart'; // View type
  groupBy?: 'type' | 'source' | 'category' | 'severity'; // Grouping
  sortOrder?: 'asc' | 'desc';    // Sort order
  zoomLevel?: number;            // Zoom level (1-10)
  showDetails?: boolean;         // Show event details
}
