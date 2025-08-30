// intelReportSerialization.ts - Phase 1 canonical serialization (schema v1)
import { IntelReportUI, IntelReportHistoryEntry } from '../../../types/intel/IntelReportUI';

export interface SerializedIntelReportV1 {
  schema: 'intel.report';
  schemaVersion: 1;
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  classification: IntelReportUI['classification'];
  status: IntelReportUI['status'];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  summary?: string;
  latitude?: number;
  longitude?: number;
  conclusions?: string[];
  recommendations?: string[];
  methodology?: string[];
  confidence?: number;
  priority?: IntelReportUI['priority'];
  targetAudience?: string[];
  sourceIntelIds?: string[];
  version?: number;
  manualSummary?: boolean;
  history?: IntelReportHistoryEntry[]; // timestamps already ISO
}

export function isSerializedIntelReportV1(x: any): x is SerializedIntelReportV1 {
  return x && x.schema === 'intel.report' && x.schemaVersion === 1 && typeof x.id === 'string';
}

export function serializeReport(r: IntelReportUI): SerializedIntelReportV1 {
  const base: SerializedIntelReportV1 = {
    schema: 'intel.report',
    schemaVersion: 1,
    id: r.id,
    title: r.title,
    content: r.content,
    author: r.author,
    category: r.category,
    tags: r.tags,
    classification: r.classification,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    summary: r.summary || undefined,
    latitude: r.latitude,
    longitude: r.longitude,
    conclusions: r.conclusions && r.conclusions.length ? r.conclusions : undefined,
    recommendations: r.recommendations && r.recommendations.length ? r.recommendations : undefined,
    methodology: r.methodology && r.methodology.length ? r.methodology : undefined,
    confidence: r.confidence,
    priority: r.priority,
    targetAudience: r.targetAudience && r.targetAudience.length ? r.targetAudience : undefined,
    sourceIntelIds: r.sourceIntelIds && r.sourceIntelIds.length ? r.sourceIntelIds : undefined,
    version: r.version,
    manualSummary: r.manualSummary,
    history: r.history && r.history.length ? r.history : undefined
  };
  return base;
}

export function parseReport(obj: unknown): { report?: IntelReportUI; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (typeof obj !== 'object' || obj === null) return { warnings, errors: ['Not an object'] };
  const raw: any = obj;
  if (!isSerializedIntelReportV1(raw)) {
    errors.push('Invalid schema header or version');
    return { warnings, errors };
  }
  // Required fields basic checks
  const required = ['title','content','author','category','classification','status','createdAt','updatedAt'];
  for (const f of required) {
    if (raw[f] == null) errors.push(`Missing required field: ${f}`);
  }
  // Enum sanity (lightweight)
  const classificationSet = new Set(['UNCLASSIFIED','CONFIDENTIAL','SECRET','TOP_SECRET']);
  if (!classificationSet.has(raw.classification)) errors.push('Invalid classification');
  const statusSet = new Set(['DRAFT','SUBMITTED','REVIEWED','APPROVED','ARCHIVED']);
  if (!statusSet.has(raw.status)) errors.push('Invalid status');
  // Confidence range
  if (raw.confidence != null && (typeof raw.confidence !== 'number' || raw.confidence < 0 || raw.confidence > 1)) {
    warnings.push('confidence out of range');
  }
  // Build UI object if no fatal errors
  if (errors.length) return { warnings, errors };
  const report: IntelReportUI = {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    author: raw.author,
    category: raw.category,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    classification: raw.classification,
    status: raw.status,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    summary: raw.summary,
    latitude: raw.latitude,
    longitude: raw.longitude,
    conclusions: raw.conclusions || [],
    recommendations: raw.recommendations || [],
    methodology: raw.methodology || [],
    confidence: raw.confidence,
    priority: raw.priority,
    targetAudience: raw.targetAudience || [],
    sourceIntelIds: raw.sourceIntelIds || [],
    version: raw.version,
    manualSummary: raw.manualSummary,
    history: raw.history || []
  };
  return { report, warnings, errors };
}
