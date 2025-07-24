/**
 * IntelWeb Component Architecture
 * 
 * Detailed component specifications for the Obsidian-inspired interface
 */

import type {
  IntelReportPackage,
  IntelSource
} from '../../types/IntelReportPackage';
import type {
  VirtualFile,
  VirtualFileSystem
} from '../../types/DataPack';

/*
===============================================
🏗️ COMPONENT SPECIFICATIONS
===============================================
*/

export interface IntelWebProps {
  packageId?: string; // Load specific IntelReportPackage
  initialView?: 'graph' | 'editor' | 'canvas';
  onPackageChange?: (pkg: IntelReportPackage) => void;
}

export interface IntelWebState {
  currentPackage: IntelReportPackage | null;
  activeFile: VirtualFile | null;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  currentView: 'graph' | 'editor' | 'canvas';
  searchQuery: string;
  selectedNodes: string[];
}

/*
===============================================
📱 MOBILE-FIRST DESIGN CONSIDERATIONS
===============================================
*/

export interface MobileAdaptations {
  // Touch-friendly graph interactions
  graphTouch: {
    nodeTapRadius: number; // Larger touch targets
    pinchZoom: boolean;
    panGestures: boolean;
    longPressContextMenu: boolean;
  };
  
  // Responsive sidebar behavior
  sidebarBehavior: {
    autoCollapse: boolean;
    swipeNavigation: boolean;
    overlayMode: boolean; // Mobile sidebars overlay content
  };
  
  // Editor optimizations
  editorMobile: {
    toolbarSimplified: boolean;
    autoFocusText: boolean;
    keyboardAware: boolean; // Adjust layout for keyboard
  };
}

/*
===============================================
🎨 THEMING SYSTEM - OBSIDIAN COMPATIBILITY
===============================================
*/

export interface IntelWebTheme {
  name: string;
  colors: {
    // Base colors (matching Obsidian)
    background: string;
    foreground: string;
    muted: string;
    accent: string;
    
    // Intelligence-specific colors
    classifications: {
      unclassified: string;
      confidential: string;
      secret: string;
      topSecret: string;
    };
    
    // Graph colors
    nodes: {
      report: string;
      entity: string;
      location: string;
      event: string;
      source: string;
    };
    
    // UI elements
    sidebar: string;
    editor: string;
    borders: string;
  };
  
  // Typography (Obsidian-style)
  fonts: {
    interface: string; // UI font
    text: string; // Editor font
    monospace: string; // Code font
  };
  
  // Spacing (consistent with Obsidian)
  spacing: {
    xs: string; // 4px
    sm: string; // 8px
    md: string; // 16px
    lg: string; // 24px
    xl: string; // 32px
  };
}

/*
===============================================
🔍 SEARCH SYSTEM SPECIFICATIONS
===============================================
*/

export interface IntelSearchEngine {
  // Search capabilities
  fullTextSearch: (query: string) => Promise<SearchResult[]>;
  metadataSearch: (filters: SearchFilters) => Promise<SearchResult[]>;
  fuzzySearch: (query: string) => Promise<SearchResult[]>;
  
  // Advanced features
  searchSuggestions: (partial: string) => string[];
  searchHistory: SearchQuery[];
  savedSearches: SavedSearch[];
}

export interface SearchFilters {
  classification?: string[];
  confidence?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
  authors?: string[];
  tags?: string[];
  entityTypes?: string[];
  hasCoordinates?: boolean;
  sourceTypes?: string[];
}

export interface SearchResult {
  file: VirtualFile;
  matches: SearchMatch[];
  score: number;
  snippet: string;
}

export interface SearchMatch {
  field: 'content' | 'title' | 'tags' | 'metadata';
  start: number;
  end: number;
  context: string;
}

/*
===============================================
🕸️ GRAPH SYSTEM SPECIFICATIONS
===============================================
*/

export interface IntelGraphEngine {
  // Core graph data
  nodes: Map<string, IntelNode>;
  edges: Map<string, IntelEdge>;
  
  // Layout algorithms
  layouts: {
    force: ForceDirectedLayout;
    hierarchical: HierarchicalLayout;
    geographic: GeographicLayout;
    timeline: TimelineLayout;
  };
  
  // Interaction handlers
  onNodeClick: (node: IntelNode, event: MouseEvent) => void;
  onNodeDoubleClick: (node: IntelNode, event: MouseEvent) => void;
  onNodeHover: (node: IntelNode | null) => void;
  onEdgeClick: (edge: IntelEdge, event: MouseEvent) => void;
  onSelectionChange: (selected: string[]) => void;
  
  // Performance optimization
  levelOfDetail: boolean; // Reduce detail when zoomed out
  clustering: boolean; // Group nodes when zoomed out
  maxVisibleNodes: number; // Limit for performance
}

export interface IntelNode {
  id: string;
  type: 'report' | 'entity' | 'location' | 'event' | 'source';
  label: string;
  
  // Visual properties
  size: number; // Calculated from connections/importance
  color: string; // Type and classification based
  icon: string; // SVG icon name
  opacity: number; // Confidence-based
  
  // Positioning
  position: { x: number; y: number };
  fixed: boolean; // Whether position is locked
  
  // Data
  file?: VirtualFile; // Associated file if any
  metadata: {
    classification: string;
    confidence: number;
    created: Date;
    modified: Date;
    author: string;
    tags: string[];
    coordinates?: { lat: number; lng: number };
  };
  
  // Graph properties
  connections: string[]; // Connected node IDs
  centrality: number; // Graph centrality score
  cluster?: string; // Cluster ID if grouped
}

export interface IntelEdge {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  
  // Relationship data
  type: 'wikilink' | 'mention' | 'reference' | 'related' | 'geographic' | 'temporal';
  strength: number; // 0-1 relationship strength
  confidence: number; // 0-1 confidence in relationship
  
  // Visual properties
  width: number; // Based on strength
  color: string; // Type-based
  style: 'solid' | 'dashed' | 'dotted';
  
  // Metadata
  metadata: {
    created: Date;
    evidence: string[]; // Supporting evidence
    notes?: string;
  };
}

/*
===============================================
📝 EDITOR SYSTEM SPECIFICATIONS
===============================================
*/

export interface IntelEditor {
  // Core editor
  monaco: Monaco.editor.IStandaloneCodeEditor;
  
  // Intelligence features
  frontmatterEditor: FrontmatterEditor;
  wikilinkProcessor: WikilinkProcessor;
  entityExtractor: EntityExtractor;
  
  // Event handlers
  onContentChange: (content: string) => void;
  onFrontmatterChange: (frontmatter: IntelFrontmatter) => void;
  onWikilinkClick: (target: string) => void;
  onEntityCreate: (entity: ExtractedEntity) => void;
}

export interface IntelFrontmatter {
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  confidence: number; // 0-1
  author: string;
  created: Date;
  modified: Date;
  tags: string[];
  entities: string[];
  sources: IntelSource[];
  coordinates?: { lat: number; lng: number; name?: string };
  relatedReports: string[];
  
  // Custom fields
  [key: string]: unknown;
}

export interface WikilinkProcessor {
  // Parse [[Entity]] links
  parseWikilinks: (content: string) => Wikilink[];
  
  // Autocomplete suggestions
  getWikilinkSuggestions: (partial: string) => string[];
  
  // Validation
  validateWikilink: (target: string) => boolean;
  
  // Creation
  createLinkedFile: (target: string, template?: string) => Promise<VirtualFile>;
}

export interface Wikilink {
  text: string; // Display text
  target: string; // Target file/entity
  start: number; // Position in content
  end: number;
  exists: boolean; // Whether target exists
}

/*
===============================================
🧠 AI-POWERED FEATURES
===============================================
*/

export interface IntelligenceAI {
  // Entity extraction
  extractEntities: (content: string) => Promise<ExtractedEntity[]>;
  
  // Relationship discovery
  findRelationships: (entities: ExtractedEntity[]) => Promise<DiscoveredRelationship[]>;
  
  // Content analysis
  analyzeContent: (content: string) => Promise<ContentAnalysis>;
  
  // Suggestions
  suggestTags: (content: string) => Promise<string[]>;
  suggestClassification: (content: string) => Promise<string>;
  suggestConfidence: (content: string, sources: IntelSource[]) => Promise<number>;
}

export interface ExtractedEntity {
  text: string; // Entity mention in text
  type: 'person' | 'organization' | 'location' | 'technology' | 'event';
  confidence: number; // 0-1 extraction confidence
  start: number; // Position in text
  end: number;
  metadata: {
    aliases?: string[];
    description?: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface DiscoveredRelationship {
  source: ExtractedEntity;
  target: ExtractedEntity;
  type: 'works_for' | 'located_at' | 'connected_to' | 'owns' | 'controls';
  confidence: number;
  evidence: string; // Text supporting the relationship
}

export interface ContentAnalysis {
  summary: string;
  keyTopics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: number; // 0-1 content complexity
  reliability: number; // 0-1 based on sources and content
  suggestedActions: string[];
}

/*
===============================================
💾 DATA PERSISTENCE & SYNC
===============================================
*/

export interface IntelWebPersistence {
  // Local storage
  saveLayout: (layout: IntelWebLayout) => Promise<void>;
  loadLayout: () => Promise<IntelWebLayout | null>;
  
  // Package management
  savePackage: (pkg: IntelReportPackage) => Promise<void>;
  loadPackage: (id: string) => Promise<IntelReportPackage | null>;
  
  // Recent files and workspaces
  saveRecentFiles: (files: RecentFile[]) => Promise<void>;
  loadRecentFiles: () => Promise<RecentFile[]>;
  
  // User preferences
  savePreferences: (prefs: UserPreferences) => Promise<void>;
  loadPreferences: () => Promise<UserPreferences>;
}

export interface IntelWebLayout {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  activeView: string;
  graphSettings: GraphSettings;
  editorSettings: EditorSettings;
}

export interface RecentFile {
  path: string;
  packageId: string;
  lastOpened: Date;
  title: string;
}

export interface UserPreferences {
  theme: string;
  fontSize: number;
  keyboardShortcuts: Record<string, string>;
  defaultView: 'graph' | 'editor' | 'canvas';
  autoSave: boolean;
  graphPhysics: PhysicsSettings;
}

/*
===============================================
⌨️ KEYBOARD SHORTCUTS - OBSIDIAN COMPATIBILITY
===============================================
*/

export const INTELWEB_SHORTCUTS = {
  // Navigation
  'Cmd+P': 'Open command palette',
  'Cmd+O': 'Quick switcher (open file)',
  'Cmd+Shift+O': 'Open package',
  'Cmd+N': 'New file',
  'Cmd+Shift+N': 'New package',
  'Cmd+W': 'Close file',
  
  // Search
  'Cmd+F': 'Search in file',
  'Cmd+Shift+F': 'Search in vault',
  'Cmd+G': 'Find next',
  'Cmd+Shift+G': 'Find previous',
  
  // Views
  'Cmd+E': 'Toggle edit/preview',
  'Cmd+Shift+E': 'Open graph view',
  'Cmd+Shift+C': 'Open canvas view',
  'Cmd+\\': 'Toggle left sidebar',
  'Cmd+Shift+\\': 'Toggle right sidebar',
  
  // Editor
  'Cmd+S': 'Save file',
  'Cmd+Z': 'Undo',
  'Cmd+Shift+Z': 'Redo',
  'Cmd+K': 'Insert link',
  'Cmd+Shift+K': 'Insert wikilink',
  
  // Intelligence-specific
  'Cmd+I': 'Extract entities',
  'Cmd+Shift+I': 'Analyze content',
  'Cmd+M': 'Add metadata',
  'Cmd+L': 'Set coordinates',
  'Cmd+T': 'Add tags',
} as const;

export default INTELWEB_SHORTCUTS;
