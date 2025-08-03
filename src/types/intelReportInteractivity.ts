import type { IntelReportData } from '../models/IntelReportData';

// Intel Report UI Interaction Type Definitions
// This file defines UI interaction states and events for Intel Reports on the Globe

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

// Base Intel Report (minimal structure for UI interactions)
export interface BaseIntelReport {
  id: string;
  title: string;
  coordinates: Coordinates;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'active' | 'archived' | 'classified';
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
  fetchReportDetails: (reportId: string) => Promise<IntelReportData>;
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
