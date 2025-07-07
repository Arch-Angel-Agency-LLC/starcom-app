/**
 * Case Manager Types
 * Earth Alliance Cyber Investigation Suite
 */

// Case Status Types
export type CaseStatus = 
  | 'active'       // Currently under investigation
  | 'pending'      // Awaiting action
  | 'closed'       // Investigation completed
  | 'archived';    // Archived for historical reference

// Case Priority Levels
export type CasePriority = 
  | 'low'          // Routine investigation
  | 'medium'       // Standard priority
  | 'high'         // Urgent investigation
  | 'critical';    // Mission critical

// Classification Levels
export type ClassificationLevel = 
  | 'unclassified'  // Public information
  | 'restricted'    // Limited distribution
  | 'confidential'  // Protected information
  | 'secret'        // Sensitive information
  | 'top-secret';   // Highly sensitive

// Case Object
export interface Case {
  id: string;                    // Unique case identifier
  title: string;                 // Case title
  description: string;           // Detailed description
  status: CaseStatus;            // Current status
  priority: CasePriority;        // Priority level
  classification: ClassificationLevel; // Security classification
  created: string;               // ISO date string (creation date)
  updated: string;               // ISO date string (last update)
  assignedTo?: string[];         // User IDs assigned to the case
  tags?: string[];               // Case tags
  relatedCases?: string[];       // Related case IDs
  evidenceItems?: string[];      // Evidence item IDs
  location?: {                   // Optional location data
    coordinates?: [number, number]; // [longitude, latitude]
    name?: string;               // Location name
  };
  timelineEvents?: string[];     // Related timeline event IDs
  entities?: string[];           // Related entity IDs
  notes?: CaseNote[];            // Case notes
  attachments?: CaseAttachment[]; // Attached files
}

// Case Note
export interface CaseNote {
  id: string;                    // Note ID
  text: string;                  // Note content
  created: string;               // ISO date string
  author: string;                // Author ID
  isPrivate: boolean;            // Visibility flag
}

// Case Attachment
export interface CaseAttachment {
  id: string;                    // Attachment ID
  name: string;                  // File name
  type: string;                  // MIME type
  size: number;                  // File size in bytes
  uploaded: string;              // ISO date string
  uploadedBy: string;            // User ID
  url: string;                   // File URL
  isEncrypted: boolean;          // Encryption flag
}

// Case Filter Options
export interface CaseFilter {
  status?: CaseStatus[];         // Filter by status
  priority?: CasePriority[];     // Filter by priority
  classification?: ClassificationLevel[]; // Filter by classification
  assignedTo?: string[];         // Filter by assigned users
  tags?: string[];               // Filter by tags
  dateRange?: {                  // Filter by date range
    start?: string;              // ISO date string
    end?: string;                // ISO date string
  };
  search?: string;               // Text search
}

// Case Data Structure
export interface CaseData {
  cases: Case[];                 // List of cases
  totalCount: number;            // Total number of cases matching filter
  page: number;                  // Current page
  pageSize: number;              // Page size
  availableTags: string[];       // Available tags
}

// Case View Options
export interface CaseViewOptions {
  view: 'list' | 'grid' | 'calendar'; // View type
  sortBy: 'created' | 'updated' | 'priority' | 'status'; // Sort field
  sortOrder: 'asc' | 'desc';     // Sort order
  pageSize: number;              // Items per page
}
