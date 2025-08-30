// reportValidation.ts - Phase 2 central validation
import { IntelReportUI } from '../../../types/intel/IntelReportUI';

export interface ReportValidationIssue {
  field: string;
  code: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface ValidationOptions {
  mode?: 'create' | 'update' | 'import';
  maxArrayLengths?: { conclusions?: number; recommendations?: number; methodology?: number };
}

const DEFAULT_MAX = { conclusions: 20, recommendations: 20, methodology: 40 };

export function validateReport(r: IntelReportUI, opts: ValidationOptions = {}): ReportValidationIssue[] {
  const issues: ReportValidationIssue[] = [];
  const mode = opts.mode || 'update';
  const max = { ...DEFAULT_MAX, ...(opts.maxArrayLengths || {}) };

  const req = (field: keyof IntelReportUI) => {
    if ((r as any)[field] == null || (typeof (r as any)[field] === 'string' && (r as any)[field].trim() === '')) {
      issues.push({ field: String(field), code: 'REQUIRED', severity: 'ERROR', message: `${field} is required` });
    }
  };
  req('title');
  req('content');

  const classificationSet = new Set(['UNCLASSIFIED','CONFIDENTIAL','SECRET','TOP_SECRET']);
  if (!classificationSet.has(r.classification)) {
    issues.push({ field: 'classification', code: 'INVALID_ENUM', severity: 'ERROR', message: 'Invalid classification' });
  }
  const statusSet = new Set(['DRAFT','SUBMITTED','REVIEWED','APPROVED','ARCHIVED']);
  if (!statusSet.has(r.status)) {
    issues.push({ field: 'status', code: 'INVALID_ENUM', severity: 'ERROR', message: 'Invalid status' });
  }
  if (r.confidence != null && (r.confidence < 0 || r.confidence > 1)) {
    issues.push({ field: 'confidence', code: 'OUT_OF_RANGE', severity: 'WARN', message: 'Confidence should be 0..1' });
  }
  const geoPair = (r.latitude != null) !== (r.longitude != null);
  if (geoPair) {
    issues.push({ field: 'latitude', code: 'GEO_PAIR', severity: 'WARN', message: 'Latitude & longitude should be both provided or neither' });
  } else if (r.latitude != null && r.longitude != null) {
    if (r.latitude < -90 || r.latitude > 90) issues.push({ field: 'latitude', code: 'GEO_RANGE', severity: 'WARN', message: 'Latitude out of range' });
    if (r.longitude < -180 || r.longitude > 180) issues.push({ field: 'longitude', code: 'GEO_RANGE', severity: 'WARN', message: 'Longitude out of range' });
  }
  const checkArray = (arr: any[] | undefined, name: string, limit: number) => {
    if (!arr) return;
    if (arr.length > limit) {
      issues.push({ field: name, code: 'TOO_LONG', severity: 'WARN', message: `${name} length exceeds ${limit}` });
    }
  };
  checkArray(r.conclusions, 'conclusions', max.conclusions!);
  checkArray(r.recommendations, 'recommendations', max.recommendations!);
  checkArray(r.methodology, 'methodology', max.methodology!);
  // duplicate tags
  if (r.tags && r.tags.length) {
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const t of r.tags) {
      const lower = t.toLowerCase();
      if (seen.has(lower)) dups.add(lower); else seen.add(lower);
    }
    if (dups.size) {
      issues.push({ field: 'tags', code: 'DUPLICATE', severity: 'WARN', message: `Duplicate tags: ${Array.from(dups).join(', ')}` });
    }
  }

  if (mode === 'import') {
    // import-specific heuristics
    if (!r.history || !r.history.length) {
      issues.push({ field: 'history', code: 'MISSING_HISTORY', severity: 'INFO', message: 'Imported report has no history entries' });
    }
  }

  return issues;
}
