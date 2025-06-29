/**
 * Intel Reports 3D - Core Type Definitions
 * 
 * Unified type definitions for the Intel Reports 3D system.
 * This file establishes the foundation for context-aware Intel Reports
 * that integrate seamlessly with the Starcom HUD architecture.
 */

// =============================================================================
// CORE INTEL REPORT DATA STRUCTURES
// =============================================================================

/**
 * Core Intel Report data structure
 * Contains all essential information for a 3D intel report
 */
export interface IntelReport3DData {
  // Identity
  id: string;
  title: string;
  
  // Security classification
  classification: IntelClassification;
  
  // Source and temporal data
  source: string;
  timestamp: Date;
  expiresAt?: Date;
  
  // Geospatial location
  location: IntelLocation;
  
  // Content data
  content: IntelContent;
  
  // 3D visualization properties
  visualization: IntelVisualization;
  
  // Metadata for analysis and filtering
  metadata: IntelMetadata;
  
  // Relationships to other intel reports
  relationships?: IntelRelationship[];
}

/**
 * Security classification levels
 */
export type IntelClassification = 
  | 'UNCLASSIFIED'
  | 'CONFIDENTIAL'
  | 'SECRET'
  | 'TOP_SECRET'
  | 'COMPARTMENTED';

/**
 * Geospatial location with optional altitude
 */
export interface IntelLocation {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number;
  region?: string;
  timezone?: string;
}

/**
 * Intel report content structure
 */
export interface IntelContent {
  summary: string;
  details: string;
  attachments?: IntelAttachment[];
  keywords?: string[];
  analysis?: string;
  recommendations?: string[];
}

/**
 * Attachment data for intel reports
 */
export interface IntelAttachment {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'data';
  name: string;
  url: string;
  size: number;
  classification: IntelClassification;
  thumbnail?: string;
}

/**
 * 3D visualization properties
 */
export interface IntelVisualization {
  markerType: IntelMarkerType;
  color: string;
  size: number;
  opacity: number;
  priority: IntelPriority;
  animation?: IntelAnimationConfig;
  icon?: string;
  label?: IntelLabelConfig;
}

/**
 * Intel marker types for 3D rendering
 */
export type IntelMarkerType = 
  | 'standard'      // Default intel marker
  | 'priority'      // High-priority intel
  | 'alert'         // Alert/warning intel
  | 'classified'    // Classified intel marker
  | 'verified'      // Verified intel marker
  | 'unverified'    // Unverified intel marker
  | 'archived';     // Archived intel marker

/**
 * Intel priority levels
 */
export type IntelPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

/**
 * Animation configuration for intel markers
 */
export interface IntelAnimationConfig {
  enabled: boolean;
  type: 'pulse' | 'rotate' | 'bounce' | 'glow' | 'oscillate';
  duration: number;        // Animation duration in ms
  delay?: number;          // Start delay in ms
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  loop?: boolean;          // Whether to loop the animation
  amplitude?: number;      // For oscillation/bounce animations
}

/**
 * Label configuration for intel markers
 */
export interface IntelLabelConfig {
  text: string;
  visible: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  fontSize: number;
  color: string;
  backgroundColor?: string;
}

/**
 * Intel metadata for analysis and filtering
 */
export interface IntelMetadata {
  tags: string[];
  confidence: number;      // 0-1, reliability of information
  reliability: number;     // 0-1, source reliability
  freshness: number;       // 0-1, how recent/relevant
  threat_level?: IntelThreatLevel;
  category: IntelCategory;
  subcategory?: string;
  analyst?: string;
  verified_by?: string[];
  related_incidents?: string[];
}

/**
 * Threat level classification
 */
export type IntelThreatLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'critical';

/**
 * Intel category classification
 */
export type IntelCategory = 
  | 'cyber_threat'
  | 'physical_security'
  | 'financial_crime'
  | 'geopolitical'
  | 'infrastructure'
  | 'personnel'
  | 'operational'
  | 'strategic'
  | 'tactical';

/**
 * Relationships between intel reports
 */
export interface IntelRelationship {
  id: string;
  type: IntelRelationshipType;
  target_intel_id: string;
  strength: number;        // 0-1, strength of relationship
  description?: string;
  created_by?: string;
  created_at: Date;
}

/**
 * Types of relationships between intel reports
 */
export type IntelRelationshipType = 
  | 'related_to'
  | 'follows_from'
  | 'contradicts'
  | 'confirms'
  | 'updates'
  | 'supersedes'
  | 'part_of'
  | 'references';

// =============================================================================
// 3D RENDERING AND INTERACTION TYPES
// =============================================================================

/**
 * 3D rendering data for intel reports
 * Optimized for Globe.gl rendering performance
 */
export interface IntelReport3DRenderData {
  id: string;
  
  // 3D position [longitude, latitude, altitude]
  position: [number, number, number];
  
  // Render properties
  renderProps: IntelRenderProps;
  
  // Interaction state
  interactionState: IntelInteractionState;
  
  // Performance optimization data
  lodLevel?: IntelLODLevel;
  
  // Context-sensitive display
  contextVisibility?: boolean;
}

/**
 * Rendering properties for 3D intel markers
 */
export interface IntelRenderProps {
  visible: boolean;
  scale: number;
  rotation: [number, number, number];
  color: string;
  opacity: number;
  animation?: IntelAnimationConfig;
  zIndex?: number;
}

/**
 * Interaction state for intel markers
 */
export interface IntelInteractionState {
  hovered: boolean;
  selected: boolean;
  focused: boolean;
  clickable: boolean;
  draggable?: boolean;
}

/**
 * Level of Detail for performance optimization
 */
export type IntelLODLevel = 'high' | 'medium' | 'low' | 'hidden';

// =============================================================================
// VIEWPORT AND PERFORMANCE TYPES
// =============================================================================

/**
 * Viewport configuration for performance optimization
 */
export interface IntelReport3DViewport {
  bounds: IntelViewportBounds;
  zoom: number;
  maxItems: number;
  lodLevel: IntelLODLevel;
  priorityThreshold?: IntelPriority;
}

/**
 * Geographic bounds for viewport culling
 */
export interface IntelViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  minAltitude?: number;
  maxAltitude?: number;
}

/**
 * Performance metrics for intel rendering
 */
export interface IntelPerformanceMetrics {
  totalIntelReports: number;
  visibleIntelReports: number;
  renderTime: number;
  memoryUsage: number;
  frameRate: number;
  lastUpdate: Date;
}

// =============================================================================
// SEARCH AND FILTERING TYPES
// =============================================================================

/**
 * Search criteria for intel reports
 */
export interface IntelSearchCriteria {
  // Text search
  query?: string;
  
  // Geospatial search
  location?: {
    center: IntelLocation;
    radius: number; // in kilometers
  };
  
  // Temporal search
  timeRange?: {
    start: Date;
    end: Date;
  };
  
  // Classification filter
  classification?: IntelClassification[];
  
  // Category filter
  categories?: IntelCategory[];
  
  // Priority filter
  priorities?: IntelPriority[];
  
  // Threat level filter
  threatLevels?: IntelThreatLevel[];
  
  // Metadata filters
  tags?: string[];
  minConfidence?: number;
  minReliability?: number;
  
  // Relationship filters
  relatedTo?: string; // Intel report ID
  relationshipTypes?: IntelRelationshipType[];
}

/**
 * Search results with pagination and metadata
 */
export interface IntelSearchResults {
  results: IntelReport3DData[];
  totalCount: number;
  pagination: {
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  searchMetadata: {
    query: IntelSearchCriteria;
    executionTime: number;
    filters_applied: string[];
  };
}

// =============================================================================
// ERROR AND VALIDATION TYPES
// =============================================================================

/**
 * Validation result for intel report data
 */
export interface IntelValidationResult {
  valid: boolean;
  errors: IntelValidationError[];
  warnings: IntelValidationWarning[];
}

/**
 * Validation error details
 */
export interface IntelValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation warning details
 */
export interface IntelValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Intel operation errors
 */
export type IntelErrorType = 
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'RENDERING_ERROR'
  | 'CONTEXT_ERROR'
  | 'PERFORMANCE_ERROR';

/**
 * Intel error with context
 */
export interface IntelError {
  type: IntelErrorType;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  context?: {
    operation: string;
    intelId?: string;
    userId?: string;
  };
}

// =============================================================================
// WORKFLOW AND EVENT TYPES
// =============================================================================

/**
 * Intel report workflow states
 */
export type IntelWorkflowState = 
  | 'draft'          // Being created/edited
  | 'under_review'   // Pending analyst review
  | 'verified'       // Verified by analyst
  | 'published'      // Published and available
  | 'archived'       // Archived but accessible
  | 'redacted'       // Partially redacted
  | 'classified_hold'; // On security hold

/**
 * Workflow transition information
 */
export interface IntelWorkflowTransition {
  fromState: IntelWorkflowState;
  toState: IntelWorkflowState;
  timestamp: Date;
  actor: string;
  reason?: string;
  notes?: string;
}

/**
 * Intel event types for audit and tracking
 */
export type IntelEventType = 
  | 'created'
  | 'updated'
  | 'viewed'
  | 'shared'
  | 'exported'
  | 'classified'
  | 'declassified'
  | 'archived'
  | 'deleted'
  | 'relationship_added'
  | 'relationship_removed';

/**
 * Intel report event for audit trail
 */
export interface IntelReportEvent {
  id: string;
  reportId: string;
  type: IntelEventType;
  timestamp: Date;
  actor: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// =============================================================================
// ADVANCED ANALYSIS TYPES
// =============================================================================

/**
 * Advanced confidence scoring
 */
export interface IntelConfidenceScoring {
  overall: number;          // 0-1, overall confidence
  source: number;           // 0-1, source reliability
  corroboration: number;    // 0-1, how well corroborated
  recency: number;          // 0-1, how recent/relevant
  analyst_assessment: number; // 0-1, analyst confidence
  
  // Breakdown by factors
  factors: {
    source_track_record: number;
    information_consistency: number;
    cross_validation: number;
    temporal_relevance: number;
    geospatial_accuracy: number;
  };
}

/**
 * Sentiment and tone analysis
 */
export interface IntelSentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  confidence_level: number; // 0-1
  emotional_indicators: string[];
  key_phrases: string[];
  language_patterns: Record<string, number>;
}

// =============================================================================
// COLLECTION AND DISTRIBUTION TYPES
// =============================================================================

/**
 * Intel collection requirements
 */
export interface IntelCollectionRequirement {
  id: string;
  priority: IntelPriority;
  geographic_area: IntelLocation[];
  time_frame: {
    start: Date;
    end: Date;
    recurring?: boolean;
  };
  information_types: IntelCategory[];
  classification_level: IntelClassification;
  requestor: string;
  justification: string;
}

/**
 * Distribution control and dissemination
 */
export interface IntelDistributionControl {
  classification: IntelClassification;
  dissemination_controls: string[]; // e.g., ['NOFORN', 'ORCON']
  authorized_recipients: string[];
  distribution_list: string[];
  embargo_until?: Date;
  destruction_date?: Date;
}

/**
 * 3D Animation configuration for intel markers
 */
export interface IntelAnimationConfig {
  enabled: boolean;
  type: 'pulse' | 'rotate' | 'bounce' | 'glow' | 'oscillate';
  duration: number;        // Animation duration in ms
  delay?: number;          // Start delay in ms
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  loop?: boolean;          // Whether to loop the animation
  amplitude?: number;      // For oscillation/bounce animations
}

/**
 * Advanced 3D marker geometry
 */
export interface Intel3DGeometry {
  type: 'sphere' | 'cube' | 'cylinder' | 'cone' | 'octahedron' | 'custom';
  scale: [number, number, number];
  rotation: [number, number, number];
  offset: [number, number, number];
  
  // Custom geometry properties
  customGeometry?: {
    vertices: number[];
    faces: number[];
    normals?: number[];
    uvs?: number[];
  };
  
  // LOD geometry variants
  lodGeometry?: {
    high: Intel3DGeometry;
    medium: Intel3DGeometry;
    low: Intel3DGeometry;
  };
}

/**
 * Material and shader properties for 3D visualization
 */
export interface Intel3DMaterial {
  type: 'standard' | 'phong' | 'basic' | 'shader';
  color: string;
  opacity: number;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  
  // Texture properties
  textures?: {
    diffuse?: string;
    normal?: string;
    metalness?: string;
    roughness?: string;
    emissive?: string;
  };
  
  // Custom shader properties
  shaderUniforms?: Record<string, unknown>;
}

/**
 * 3D lighting configuration for intel visualization
 */
export interface Intel3DLighting {
  ambient: {
    color: string;
    intensity: number;
  };
  directional: {
    color: string;
    intensity: number;
    position: [number, number, number];
    castShadow: boolean;
  };
  point?: {
    color: string;
    intensity: number;
    position: [number, number, number];
    distance: number;
    decay: number;
  };
}

// =============================================================================
// INTERACTION AND ACCESSIBILITY TYPES
// =============================================================================

/**
 * Accessibility configuration for intel reports
 */
export interface IntelAccessibilityConfig {
  screenReaderEnabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  keyboardNavigation: boolean;
  
  // Screen reader announcements
  announcements: {
    onHover: boolean;
    onSelect: boolean;
    onFocus: boolean;
    onUpdate: boolean;
  };
  
  // ARIA configuration
  aria: {
    labels: Record<string, string>;
    descriptions: Record<string, string>;
    roles: Record<string, string>;
  };
}

/**
 * Touch and gesture support
 */
export interface IntelTouchConfig {
  enabled: boolean;
  gestures: {
    tap: boolean;
    doubleTap: boolean;
    longPress: boolean;
    pinch: boolean;
    swipe: boolean;
  };
  
  // Gesture thresholds
  thresholds: {
    tapDuration: number;
    longPressDuration: number;
    swipeDistance: number;
    pinchSensitivity: number;
  };
}

/**
 * Intel report interaction events
 */
export interface IntelInteractionEvent {
  type: 'hover' | 'click' | 'focus' | 'select' | 'deselect' | 'drag' | 'drop';
  reportId: string;
  timestamp: Date;
  source: 'mouse' | 'keyboard' | 'touch' | 'api';
  
  // Event-specific data
  mouseEvent?: {
    position: { x: number; y: number };
    button: number;
    modifiers: string[];
  };
  
  keyboardEvent?: {
    key: string;
    code: string;
    modifiers: string[];
  };
  
  touchEvent?: {
    touches: { x: number; y: number; id: number }[];
    type: 'start' | 'move' | 'end' | 'cancel';
  };
}

/**
 * Debouncing and throttling configuration
 */
export interface IntelInteractionThrottling {
  hover: number;           // Hover debounce in ms
  click: number;           // Click debounce in ms
  scroll: number;          // Scroll throttle in ms
  resize: number;          // Resize throttle in ms
  search: number;          // Search debounce in ms
}
