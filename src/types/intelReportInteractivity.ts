// Enhanced Intel Report Type Definitions
// This file defines the complete data structure for interactive Intel Reports

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface IntelReportAttachment {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio';
  name: string;
  url: string;
  size?: number;
  thumbnail?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: Date;
}

export interface IntelReportSource {
  id: string;
  name: string;
  type: 'human' | 'signals' | 'imagery' | 'measurement' | 'open-source';
  reliability: 1 | 2 | 3 | 4 | 5; // 1 = unreliable, 5 = completely reliable
  confidenceLevel: 'low' | 'medium' | 'high';
}

export interface GeographicContext {
  region: string;
  country: string;
  city?: string;
  timezone: string;
  population?: number;
  strategicImportance: 'low' | 'medium' | 'high' | 'critical';
}

// Base Intel Report (existing structure)
export interface BaseIntelReport {
  id: string;
  title: string;
  coordinates: Coordinates;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'active' | 'archived' | 'classified';
}

// Enhanced Intel Report for detailed interactions
export interface EnhancedIntelReport extends BaseIntelReport {
  // Content
  summary: string; // Brief overview for tooltips
  description: string; // Detailed analysis
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  
  // Source information
  source: IntelReportSource;
  reportingOrganization: string;
  analystNotes?: string;
  
  // Geographic and temporal context
  geographicContext: GeographicContext;
  eventTimeframe?: {
    startTime: Date;
    endTime?: Date;
    isOngoing: boolean;
  };
  
  // Assessment and analysis
  threatLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'severe';
  impactAssessment: string;
  verificationStatus: 'unverified' | 'partially-verified' | 'verified' | 'disputed';
  
  // Relationships and context
  relatedReports: string[]; // IDs of related reports
  tags: string[];
  keywords: string[];
  
  // Attachments and media
  attachments: IntelReportAttachment[];
  
  // Action items and follow-ups
  actionItems: ActionItem[];
  
  // Metadata
  createdBy: string;
  lastUpdated: Date;
  viewCount?: number;
  accessLevel: 'public' | 'restricted' | 'classified';
}

// UI State for interactions
export interface IntelReportInteractionState {
  hoveredReportId: string | null;
  selectedReportId: string | null;
  tooltipVisible: boolean;
  popupVisible: boolean;
  popupPosition: {
    x: number;
    y: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

// Tooltip data (minimal for performance)
export interface IntelReportTooltipData {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  threatLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'severe';
  classification: string;
}

// Globe interaction events
export interface IntelReportGlobeEvent {
  type: 'hover' | 'click' | 'hover-end';
  reportId: string;
  coordinates: {
    screen: { x: number; y: number };
    world: Coordinates;
  };
  timestamp: Date;
}

// Context actions
export interface IntelReportContextActions {
  setHoveredReport: (reportId: string | null) => void;
  setSelectedReport: (reportId: string | null) => void;
  openPopup: (reportId: string, position?: { x: number; y: number }) => void;
  closePopup: () => void;
  showTooltip: (reportId: string, position: { x: number; y: number }) => void;
  hideTooltip: () => void;
  fetchReportDetails: (reportId: string) => Promise<EnhancedIntelReport>;
}

// Animation configuration
export interface IntelReportAnimationConfig {
  hover: {
    duration: number; // 150ms
    scaleMultiplier: number; // 1.05
    glowIntensity: number; // 0.3
  };
  click: {
    duration: number; // 200ms
    scaleMultiplier: number; // 1.1
    pulseCount: number; // 1
  };
  tooltip: {
    showDelay: number; // 150ms
    hideDelay: number; // 100ms
    fadeInDuration: number; // 200ms
    fadeOutDuration: number; // 150ms
  };
  popup: {
    slideInDuration: number; // 300ms
    slideOutDuration: number; // 250ms
    backdropFadeDuration: number; // 200ms
  };
}

// Error types
export type IntelReportError = 
  | 'NETWORK_ERROR'
  | 'REPORT_NOT_FOUND' 
  | 'ACCESS_DENIED'
  | 'INVALID_DATA'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface IntelReportErrorState {
  type: IntelReportError;
  message: string;
  reportId?: string;
  timestamp: Date;
  retryable: boolean;
}

// Interaction State for enhanced user experience tracking
export interface InteractionState {
  isHovering: boolean;
  isClicking: boolean;
  isLoading: boolean;
  hasError: boolean;
  focusedReportId: string | null;
  lastInteractionTime: number;
  interactionCount: number;
}
