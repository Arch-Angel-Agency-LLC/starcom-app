/**
 * IntelReportDataPack - Specialized DataPack for Intelligence Reports
 * 
 * This extends the base DataPack format with intelligence-specific structure
 * and Obsidian vault compatibility for graph visualization in IntelWeb.
 */

import { DataPack } from './DataPack';

/**
 * IntelReportDataPack - Typecast of DataPack with intelligence-specific structure
 */
export interface IntelReportDataPack extends DataPack {
  // Intelligence-specific metadata
  intelligence: {
    sources: IntelSource[];
    confidence: number; // 0.0 - 1.0
    reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // Source reliability rating
    analysisType: 'OSINT' | 'SIGINT' | 'HUMINT' | 'GEOINT' | 'FININT' | 'TECHINT';
    priority: 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH';
    
    // Geographic scope
    geographicScope: {
      regions: string[];
      coordinates?: {
        centerLat: number;
        centerLng: number;
        radiusKm: number;
      };
    };
    
    // Temporal scope
    temporalScope: {
      collectionStart: string; // ISO timestamp
      collectionEnd: string; // ISO timestamp
      relevanceExpiry?: string; // ISO timestamp
    };
    
    // Analysis metadata
    entitiesCount: number;
    relationshipsCount: number;
    keyFindings: string[];
    recommendations: string[];
  };
  
  // Obsidian vault structure compliance
  obsidianVault: ObsidianVaultStructure;
  
  // Legacy compatibility
  legacyIntelReport?: unknown; // For backward compatibility with existing IntelReportData
}

/**
 * Intelligence source information
 */
export interface IntelSource {
  id: string;
  name: string;
  type: 'OSINT' | 'SIGINT' | 'HUMINT' | 'GEOINT' | 'FININT' | 'TECHINT';
  reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  accessDate: string; // ISO timestamp
  url?: string;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Obsidian vault structure for graph visualization
 */
export interface ObsidianVaultStructure {
  // Standard Obsidian folders
  folders: {
    'People/'?: ObsidianFolder;
    'Organizations/'?: ObsidianFolder;
    'Establishments/'?: ObsidianFolder;
    'Regions/'?: ObsidianFolder;
    'Events/'?: ObsidianFolder;
    'Documents/'?: ObsidianFolder;
    'Assets/'?: ObsidianFolder;
    'Templates/'?: ObsidianFolder;
    'Archive/'?: ObsidianFolder;
    [key: string]: ObsidianFolder | undefined;
  };
  
  // Vault configuration
  config: {
    plugins: ObsidianPlugin[];
    themes: string[];
    hotkeys: Record<string, string>;
    graph: ObsidianGraphConfig;
  };
  
  // Workspace layout
  workspace: {
    leftSidebar: boolean;
    rightSidebar: boolean;
    activeView: 'graph' | 'files' | 'search' | 'outline';
    pinnedFiles: string[];
  };
}

/**
 * Obsidian folder structure
 */
export interface ObsidianFolder {
  path: string;
  files: ObsidianFile[];
  subfolders: ObsidianFolder[];
  
  // Folder metadata
  indexFile?: string; // Path to folder index (e.g., "README.md")
  template?: string; // Template to use for new files
  tags: string[];
  
  // Intelligence-specific
  entityType?: 'person' | 'organization' | 'location' | 'event' | 'document';
}

/**
 * Obsidian file representation
 */
export interface ObsidianFile {
  // Basic file info
  path: string;
  name: string;
  content: string;
  
  // Obsidian-specific metadata
  frontmatter: ObsidianFrontmatter;
  wikilinks: ObsidianWikilink[];
  hashtags: string[];
  backlinks: string[];
  
  // Intelligence-specific
  entityType?: 'person' | 'organization' | 'location' | 'event' | 'document';
  confidence?: number;
  verificationStatus?: 'verified' | 'unverified' | 'disputed' | 'classified';
  
  // Content analysis
  wordCount: number;
  readingTime: number; // Minutes
  lastModified: string; // ISO timestamp
}

/**
 * Obsidian frontmatter (YAML metadata at top of markdown files)
 */
export interface ObsidianFrontmatter {
  // Standard frontmatter
  title?: string;
  aliases?: string[];
  tags?: string[];
  created?: string;
  modified?: string;
  
  // Intelligence-specific frontmatter
  source?: string;
  confidence?: number;
  verified?: boolean;
  
  // Entity-specific frontmatter
  entityType?: 'person' | 'organization' | 'location' | 'event' | 'document';
  entityId?: string;
  
  // Person-specific
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  occupation?: string;
  knownAliases?: string[];
  
  // Organization-specific
  organizationType?: string;
  founded?: string;
  headquarters?: string;
  parentOrg?: string;
  subsidiaries?: string[];
  
  // Location-specific
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  country?: string;
  region?: string;
  
  // Event-specific
  eventDate?: string;
  duration?: string;
  participants?: string[];
  location?: string;
  
  // Custom fields
  [key: string]: string | number | boolean | string[] | Record<string, unknown> | undefined;
}

/**
 * Obsidian wikilink [[Entity Name|Display Text]]
 */
export interface ObsidianWikilink {
  target: string; // The actual file/entity being linked to
  displayText?: string; // Optional display text
  type: 'internal' | 'external' | 'unresolved';
  
  // Intelligence context
  relationshipType?: 'related' | 'parent' | 'child' | 'alias' | 'member' | 'works-for' | 'located-in';
  confidence?: number;
  source?: string;
}

/**
 * Obsidian plugin configuration
 */
export interface ObsidianPlugin {
  id: string;
  name: string;
  enabled: boolean;
  settings: Record<string, string | number | boolean>;
}

/**
 * Obsidian graph view configuration
 */
export interface ObsidianGraphConfig {
  // Visual settings
  showTags: boolean;
  showAttachments: boolean;
  showExistingOnly: boolean;
  showOrphans: boolean;
  
  // Physics simulation
  centerStrength: number; // 0.0 - 1.0
  repelStrength: number; // 0.0 - 1.0
  linkStrength: number; // 0.0 - 1.0
  linkDistance: number; // pixels
  
  // Filtering
  search: string;
  tags: string[];
  
  // Coloring
  colorGroups: ObsidianColorGroup[];
  
  // Intelligence-specific
  filterByConfidence: boolean;
  minConfidence: number;
  showSources: boolean;
}

/**
 * Color grouping for graph visualization
 */
export interface ObsidianColorGroup {
  query: string; // Obsidian search query
  color: string; // Hex color
  name: string;
}

/**
 * Processed intelligence entities for graph visualization
 */
export interface IntelEntity {
  // Basic entity info
  id: string;
  name: string;
  type: 'person' | 'organization' | 'location' | 'event' | 'document' | 'asset';
  
  // Content
  filePath: string; // Path within the DataPack
  content: string;
  frontmatter: ObsidianFrontmatter;
  
  // Relationships
  outgoingLinks: IntelRelationship[];
  incomingLinks: IntelRelationship[];
  
  // Intelligence metadata
  confidence: number;
  sources: string[];
  verified: boolean;
  
  // Graph visualization
  position?: { x: number; y: number };
  color?: string;
  size?: number;
  highlighted?: boolean;
}

/**
 * Intelligence relationship for graph edges
 */
export interface IntelRelationship {
  // Basic relationship
  id: string;
  source: string; // Entity ID
  target: string; // Entity ID
  type: string; // Relationship type
  
  // Intelligence context
  confidence: number;
  sources: string[];
  description?: string;
  
  // Temporal context
  startDate?: string;
  endDate?: string;
  
  // Graph visualization
  strength: number; // 0.0 - 1.0 for edge thickness
  color?: string;
  highlighted?: boolean;
}

/**
 * Graph analysis results
 */
export interface IntelGraphAnalysis {
  // Network metrics
  totalEntities: number;
  totalRelationships: number;
  density: number; // 0.0 - 1.0
  
  // Key entities (by centrality)
  mostConnected: IntelEntity[];
  mostInfluential: IntelEntity[];
  bridges: IntelEntity[]; // Entities that connect different clusters
  
  // Clusters/Communities
  clusters: IntelCluster[];
  
  // Confidence analysis
  highConfidenceEntities: IntelEntity[];
  lowConfidenceEntities: IntelEntity[];
  unverifiedEntities: IntelEntity[];
  
  // Source analysis
  sourceDistribution: Record<string, number>;
  multiSourceEntities: IntelEntity[];
}

/**
 * Intelligence cluster/community in the graph
 */
export interface IntelCluster {
  id: string;
  name: string;
  entities: string[]; // Entity IDs
  relationships: string[]; // Relationship IDs
  
  // Cluster properties
  density: number;
  centerEntity?: string; // Most central entity ID
  
  // Intelligence context
  primaryType: string; // Most common entity type
  confidence: number; // Average confidence
  
  // Visualization
  color: string;
  position: { x: number; y: number };
}
