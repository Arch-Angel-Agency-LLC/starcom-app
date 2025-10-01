// reportLifecycle.ts - lifecycle helper utilities for IntelReportService
// Pure functions: no storage or side-effects.
// NOTE: If IntelReportUI schema adds fields impacting versioning or diff logic,
//       update TRACKED_FIELDS below and related tests.

import { IntelReportUI, IntelReportHistoryEntry, IntelReportStatus } from '../../types/intel/IntelReportUI';

// Fields considered for change detection (content + analytical + metadata subset)
const TRACKED_FIELDS: (keyof IntelReportUI)[] = [
  'title',
  'summary',
  'content',
  'category',
  'tags',
  'conclusions',
  'recommendations',
  'methodology',
  'confidence',
  'priority',
  'targetAudience',
  'sourceIntelIds',
  'latitude',
  'longitude'
];

export function computeChangedFields(before: IntelReportUI, after: IntelReportUI): string[] {
  const changed: string[] = [];
  for (const f of TRACKED_FIELDS) {
    const a = before[f];
    const b = after[f];
    const eq = Array.isArray(a) && Array.isArray(b) ? a.join('\u0001') === b.join('\u0001') : a === b;
    if (!eq) changed.push(String(f));
  }
  return changed;
}

export function nextVersion(prev: IntelReportUI, changes: string[], statusChanged: boolean, _toStatus?: IntelReportStatus): number {
  // Simple numeric increment for now (Phase 6 introduces semver logic)
  if (!changes.length && !statusChanged) return prev.version || 1;
  return (prev.version || 1) + 1;
}

interface HistoryParams {
  action: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'IMPORTED';
  changes?: string[];
  fromStatus?: IntelReportStatus;
  toStatus?: IntelReportStatus;
  user?: string;
  timestamp?: string; // allow injection for deterministic tests
}

export function makeHistoryEntry(p: HistoryParams): IntelReportHistoryEntry {
  return {
    timestamp: p.timestamp || new Date().toISOString(),
    action: p.action,
    user: p.user,
    changes: p.changes && p.changes.length ? p.changes : undefined,
    fromStatus: p.fromStatus,
    toStatus: p.toStatus
  };
}
