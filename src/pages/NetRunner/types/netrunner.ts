/**
 * NetRunner Module TypeScript Type Definitions
 */

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

// Search Sources
export interface SearchSource {
  id: string;
  label: string;
  checked: boolean;
  premium?: boolean;
}

// NetRunner Tab
export type NetRunnerTab = 
  | 'all'          // All sources
  | 'social'       // Social media
  | 'news'         // News & Media
  | 'dark'         // Dark Web
  | 'technical'    // Technical sources
  | 'financial';   // Financial sources

// Entity Types
export type EntityType = 
  | 'person'       // Individual
  | 'organization' // Group, company, agency
  | 'wallet'       // Cryptocurrency wallet
  | 'address'      // Physical or virtual location
  | 'domain'       // Web domain
  | 'file'         // Document, image, etc.
  | 'event'        // Incident or happening
  | 'device'       // Hardware device
  | 'account';     // Online account

// Relationship Types
export type RelationshipType =
  | 'owner'        // Ownership relationship
  | 'member'       // Membership
  | 'associate'    // Association
  | 'transaction'  // Financial transaction
  | 'communication' // Communication
  | 'location'     // Geographic relationship
  | 'temporal'     // Time-based relationship
  | 'access'       // Access relationship
  | 'creation'     // Creation relationship
  | 'custom';      // Custom relationship

// Dashboard Mode
export type DashboardMode = 
  | 'search'        // Basic search mode
  | 'advanced'      // Advanced search mode
  | 'powertools'    // Power tools mode
  | 'bots'          // Bot automation mode
  | 'analysis'      // Intel analysis mode
  | 'marketplace'   // Intelligence Exchange mode
  | 'monitoring';   // Active monitoring mode
