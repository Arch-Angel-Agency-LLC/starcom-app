/**
 * NodeWeb Module TypeScript Type Definitions
 * Earth Alliance Cyber Investigation Suite
 * 
 * Extracted from OSINT module for use in NodeWeb functionality.
 */

// Node Types
export type NodeType = 
  | 'person'      // Individual
  | 'organization' // Group, company, agency
  | 'wallet'      // Cryptocurrency wallet
  | 'address'     // Physical or virtual location
  | 'domain'      // Web domain
  | 'file'        // Document, image, etc.
  | 'server'      // Server or host
  | 'device'      // Hardware device
  | 'account'     // Online account
  | 'network'     // Network infrastructure
  | 'threat'      // Threat actor or entity
  | 'custom';     // Custom node type

// Edge (Connection) Types
export type EdgeType =
  | 'owner'           // Ownership relationship
  | 'member'          // Membership
  | 'associate'       // Association
  | 'transaction'     // Financial transaction
  | 'communication'   // Communication
  | 'location'        // Geographic relationship
  | 'temporal'        // Time-based relationship
  | 'access'          // Access relationship
  | 'creation'        // Creation relationship
  | 'dependency'      // Dependency relationship
  | 'attack'          // Attack vector
  | 'control'         // Control relationship
  | 'custom';         // Custom relationship

// Source Types
export type SourceType =
  | 'osint'        // Open-source intelligence
  | 'social'       // Social media
  | 'blockchain'   // Blockchain data
  | 'darkweb'      // Dark web
  | 'publicRecord' // Public records
  | 'news'         // News articles
  | 'analysis'     // Analysis result
  | 'intelligence' // Intelligence report
  | 'userInput';   // Manual user input

// Source Definition
export interface Source {
  id: string;                  // Unique identifier
  type: SourceType;            // Source type
  name: string;                // Source name
  url?: string;                // Source URL
  timestamp: string;           // ISO date string
  credibility: number;         // Credibility score (0-1)
}

// Node Definition
export interface Node {
  id: string;                    // Unique identifier
  type: NodeType;                // Node type
  label: string;                 // Display label
  description?: string;          // Detailed description
  properties: Record<string, unknown>; // Node properties
  sources: Source[];             // Information sources
  confidence: number;            // Confidence score (0-1)
  created: string;               // ISO date string when created
  updated: string;               // ISO date string when last updated
  tags?: string[];               // Tags for filtering
  threatLevel?: number;          // Threat level (0-1)
  coordinates?: [number, number]; // [longitude, latitude]
  image?: string;                // Image URL
  relatedEntities?: string[];    // Related entity IDs
  metadata?: Record<string, unknown>; // Additional metadata
}

// Edge Definition
export interface Edge {
  id: string;                  // Unique identifier
  sourceId: string;            // Source node ID
  targetId: string;            // Target node ID
  type: EdgeType;              // Edge type
  label?: string;              // Display label
  directed: boolean;           // Whether the edge is directed
  properties: Record<string, unknown>; // Edge properties
  sources: Source[];           // Information sources
  confidence: number;          // Confidence score (0-1)
  weight?: number;             // Edge weight for visualization
  dateObserved?: string;       // ISO date string
  created: string;             // ISO date string when created
  updated: string;             // ISO date string when last updated
}

// Network Definition
export interface Network {
  nodes: Node[];               // Network nodes
  edges: Edge[];               // Network edges
}

// Network Statistics
export interface NetworkStats {
  nodeCount: number;           // Total number of nodes
  edgeCount: number;           // Total number of edges
  threatNodeCount: number;     // Number of threat nodes
  criticalNodeCount: number;   // Number of critical nodes
  clusterCount: number;        // Number of distinct clusters
  density: number;             // Network density
  averageDegree: number;       // Average node connections
}

// Node Filter Options
export interface NodeFilter {
  types?: NodeType[];          // Filter by node types
  tags?: string[];             // Filter by tags
  minConfidence?: number;      // Minimum confidence score
  minThreatLevel?: number;     // Minimum threat level
  maxDepth?: number;           // Maximum connection depth
  search?: string;             // Text search in node properties
  showUnconfirmed?: boolean;   // Whether to show unconfirmed nodes
}

// Visualization Options
export interface VisualizationOptions {
  viewType: 'twoD' | 'threeD' | 'hierarchical' | 'forcedirected'; // View type
  layout: string;              // Layout algorithm
  colorBy?: 'type' | 'threat' | 'confidence' | 'cluster'; // Coloring scheme
  sizeBy?: 'connections' | 'importance' | 'threat'; // Sizing scheme
  showLabels: boolean;         // Whether to show labels
  showEdges: boolean;          // Whether to show edges
  clusterNodes: boolean;       // Whether to cluster nodes
  highlightConnections: boolean; // Highlight connected nodes
}

// Node Detail
export interface NodeDetail extends Node {
  incomingEdges: Edge[];       // Edges pointing to this node
  outgoingEdges: Edge[];       // Edges pointing from this node
  relatedNodes: Node[];        // Directly connected nodes
}

// Graph Export Options
export type ExportFormat = 'json' | 'csv' | 'graphml' | 'gexf' | 'png' | 'svg';

// Graph Import Source
export type ImportSource = 'file' | 'url' | 'api' | 'clipboard';

// Graph Export Options
export interface ExportOptions {
  format: ExportFormat;
  includeProperties: boolean;
  includeSources: boolean;
  filename?: string;
}

// Graph Import Options
export interface ImportOptions {
  source: ImportSource;
  format?: ExportFormat;
  mergeStrategy?: 'replace' | 'merge' | 'append';
}

// Highlight modes for the visualizer
export enum HighlightMode {
  None = 'none',
  Selected = 'selected',
  Highlighted = 'highlighted'
}

// Network visualization options
export interface NetworkViewOptions {
  layout?: 'force' | 'circular' | 'hierarchical';
  showLabels?: boolean;
  showIcons?: boolean;
  showLegend?: boolean;
  showControls?: boolean;
  showFilters?: boolean;
  highlightMode?: HighlightMode;
  showEdgeLabels?: boolean;
  minNodeSize?: number;
  maxNodeSize?: number;
  edgeWidth?: number;
  darkMode?: boolean;
  showTooltips?: boolean;
  theme?: 'default' | 'dark' | 'light' | 'satellite';
  animate?: boolean;
}
