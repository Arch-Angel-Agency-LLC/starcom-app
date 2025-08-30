// IntelItemUI - simplified UI representation of a raw Intel (.intel) file entry
// Mirrors a subset of IntelFrontmatter + markdown content for create/list purposes.

export type IntelItemClassification = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
export type IntelReliability = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface IntelItemHistoryEntry {
  timestamp: string; // ISO
  action: 'CREATED' | 'UPDATED' | 'IMPORTED';
  user?: string;
  changes?: string[];
}

export interface IntelItemUI {
  id: string;
  title: string;
  type: string; // e.g. INDICATOR, OBSERVATION, EVENT
  classification: IntelItemClassification;
  source: string;
  reliability: IntelReliability;
  confidence: number; // 0..1
  tags: string[];
  categories: string[];
  latitude?: number;
  longitude?: number;
  content: string; // markdown body
  createdAt: Date;
  updatedAt: Date;
  verified: boolean;
  version?: number;
  history?: IntelItemHistoryEntry[];
}

export interface CreateIntelItemInput {
  title: string;
  type: string;
  classification: IntelItemClassification;
  source: string;
  reliability: IntelReliability;
  confidence: number;
  tags: string[];
  categories: string[];
  latitude?: number;
  longitude?: number;
  content: string;
  verified?: boolean;
}
