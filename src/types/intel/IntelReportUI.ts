// IntelReportUI - UI-facing representation of an Intelligence Report
// Bridges existing IntelDashboard component and the richer IntelWorkspace types.
// Dates are concrete Date objects in UI layer; persistence adapters serialize to ISO strings.

export type IntelClassification = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
export type IntelReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED';
export type IntelReportPriority = 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE';

export interface IntelReportHistoryEntry {
  timestamp: string; // ISO
  action: string; // e.g. CREATED, UPDATED, STATUS_CHANGED
  user?: string;
  changes?: string[]; // field names changed
  fromStatus?: IntelReportStatus;
  toStatus?: IntelReportStatus;
}

export interface IntelReportUI {
  id: string;
  title: string;
  content: string; // full body
  summary?: string; // optional manual summary override
  author: string;
  category: string; // single primary category (mapped to metadata.categories[0])
  tags: string[];
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
  classification: IntelClassification;
  status: IntelReportStatus;
  // Structured Analysis Fields
  conclusions?: string[];
  recommendations?: string[];
  methodology?: string[];
  confidence?: number; // 0..1
  priority?: IntelReportPriority;
  targetAudience?: string[];
  sourceIntelIds?: string[]; // IDs of linked Intel items
  // Versioning / Metadata
  version?: number; // increment per save
  manualSummary?: boolean; // indicates summary is user-provided
  history?: IntelReportHistoryEntry[]; // local history log
}

// Input when creating a new report from the UI (before id/dates assigned)
export interface CreateIntelReportInput {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[]; // already split & trimmed
  classification: IntelClassification;
  latitude?: number;
  longitude?: number;
  status?: IntelReportStatus; // optional (defaults to DRAFT)
  conclusions?: string[];
  recommendations?: string[];
  methodology?: string[];
  confidence?: number;
  priority?: IntelReportPriority;
  targetAudience?: string[];
  sourceIntelIds?: string[];
}
