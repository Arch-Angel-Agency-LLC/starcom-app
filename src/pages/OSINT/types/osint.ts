/**
 * OSINT Module TypeScript Type Definitions
 * Earth Alliance Cyber Investigation Suite
 */

// OSINT Operation Modes
export type OSINTMode = 'search' | 'investigate' | 'monitor' | 'darkweb';

// Panel Types
export type PanelType = 
  | 'search'      // Search configuration
  | 'results'     // Search results
  | 'graph'       // Entity relationship graph
  | 'timeline'    // Chronological timeline
  | 'map'         // Geospatial visualization
  | 'blockchain'  // Blockchain analysis
  | 'darkweb'     // Dark web monitoring
  | 'opsec'       // Operational security
  | 'console'     // Command console
  | 'notes'       // Investigation notes
  | 'intelligence-summary' // Real-time intelligence analysis
  | 'quick-actions';  // Quick action shortcuts

// Panel Position & Size
export interface PanelPosition {
  x: number;      // Grid column position
  y: number;      // Grid row position
  w: number;      // Width in grid columns
  h: number;      // Height in grid rows
}

// Panel Definition
export interface Panel {
  id: string;               // Unique identifier
  type: PanelType;          // Panel type
  position: PanelPosition;  // Layout position and size
  data: Record<string, unknown>; // Panel-specific data
  locked: boolean;          // Whether panel can be moved/resized
}

// Search Query Definition
export interface SearchQuery {
  text: string;              // Search text
  filters?: Record<string, unknown>; // Filter criteria
  sources?: string[];        // Data sources to search
  timeRange?: {              // Time range filter
    start?: string;          // ISO date string
    end?: string;            // ISO date string
  };
  maxResults?: number;       // Maximum results to return
  page?: number;             // Pagination page number
  sortBy?: string;           // Sort field
  sortDirection?: 'asc' | 'desc'; // Sort direction
  authenticated?: boolean;   // Whether the request is authenticated
}

// Search Result Definition
export interface SearchResult {
  id: string;                // Unique identifier
  type: 'entity' | 'relationship' | 'event' | 'document' | 'media'; // Result type
  title: string;             // Result title
  snippet: string;           // Result snippet/preview
  source: string;            // Data source
  timestamp: string;         // ISO date string
  confidence: number;        // Confidence score (0-1)
  score?: number;            // Search relevance score
  url?: string;              // Result URL
  entityIds?: string[];      // Related entity IDs
  metadata: Record<string, unknown>; // Additional metadata
}

// Entity Types
export type EntityType = 
  | 'person'      // Individual
  | 'organization' // Group, company, agency
  | 'wallet'      // Cryptocurrency wallet
  | 'address'     // Physical or virtual location
  | 'domain'      // Web domain
  | 'file'        // Document, image, etc.
  | 'event'       // Incident or happening
  | 'device'      // Hardware device
  | 'account';    // Online account

// Investigation Status
export type InvestigationStatus = 'active' | 'archived' | 'pending';

// Relationship Types
export type RelationshipType =
  | 'owner'       // Ownership relationship
  | 'member'      // Membership
  | 'associate'   // Association
  | 'transaction' // Financial transaction
  | 'communication' // Communication
  | 'location'    // Geographic relationship
  | 'temporal'    // Time-based relationship
  | 'access'      // Access relationship
  | 'creation'    // Creation relationship
  | 'custom';     // Custom relationship

// Source Types
export type SourceType =
  | 'social'      // Social media
  | 'blockchain'  // Blockchain data
  | 'darkweb'     // Dark web
  | 'publicRecord' // Public records
  | 'news'        // News articles
  | 'analysis'    // Analysis result
  | 'intelligence' // Intelligence report
  | 'userInput';  // Manual user input

// Entity Definition
export interface Entity {
  id: string;                  // Unique identifier
  type: EntityType;            // Entity type
  name: string;                // Primary name/identifier
  aliases?: string[];          // Alternative names/identifiers
  properties: Record<string, unknown>; // Entity properties
  sources: Source[];           // Information sources
  confidence: number;          // Confidence score (0-1)
  dateAdded: string;           // ISO date string
  dateUpdated: string;         // ISO date string
}

// Relationship Definition
export interface Relationship {
  id: string;                  // Unique identifier
  sourceId: string;            // Source entity ID
  targetId: string;            // Target entity ID
  type: RelationshipType;      // Relationship type
  properties: Record<string, unknown>; // Relationship properties
  sources: Source[];           // Information sources
  confidence: number;          // Confidence score (0-1)
  dateObserved: string;        // ISO date string
  dateAdded: string;           // ISO date string
}

// Source Definition
export interface Source {
  id: string;                  // Unique identifier
  type: SourceType;            // Source type
  name: string;                // Source name
  url?: string;                // Source URL
  timestamp: string;           // ISO date string
  credibility: number;         // Credibility score (0-1)
}

// Timeline Event
export interface TimelineEvent {
  id: string;                  // Unique identifier
  title: string;               // Event title
  description: string;         // Event description
  timestamp: string;           // ISO date string
  duration?: number;           // Duration in seconds
  entities: string[];          // Related entity IDs
  relationships: string[];     // Related relationship IDs
  sources: Source[];           // Information sources
  confidence: number;          // Confidence score (0-1)
  category?: string;           // Event category
  tags: string[];              // Event tags
}

// Saved Search
export interface SavedSearch {
  id: string;                  // Unique identifier
  query: string;               // Search query
  filters: Record<string, unknown>; // Search filters
  timestamp: string;           // ISO date string
  name: string;                // Search name
  description?: string;        // Search description
}

// Note
export interface Note {
  id: string;                  // Unique identifier
  content: string;             // Note content
  timestamp: string;           // ISO date string
  entities?: string[];         // Related entity IDs
  relationships?: string[];    // Related relationship IDs
}

// Investigation
export interface Investigation {
  id: string;                  // Unique identifier
  title: string;               // Investigation title
  description: string;         // Investigation description
  entities: Entity[];          // Entities in investigation
  relationships: Relationship[]; // Relationships in investigation
  timeline: TimelineEvent[];   // Timeline events
  searches: SavedSearch[];     // Saved searches
  notes: Note[];               // Investigation notes
  tags: string[];              // Investigation tags
  createdAt: string;           // ISO date string
  updatedAt: string;           // ISO date string
  owner: string;               // Owner identifier
  collaborators: string[];     // Collaborator identifiers
  status: InvestigationStatus; // Investigation status
}
