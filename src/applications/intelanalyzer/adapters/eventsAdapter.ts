import { IntelReportUI } from '../../../types/intel/IntelReportUI';
import { IntelItemUI } from '../../../types/intel/IntelItemUI';

/**
 * Event interface as defined in data-models.md
 */
export interface Event {
  id: string;
  title: string;
  timestamp: string;
  category: string;
  tags: string[];
  lat?: number;
  lon?: number;
  confidence?: number;
  sourceType: 'REPORT' | 'INTEL_ITEM';
  sourceId: string;
  entityRefs: string[];
}

/**
 * Adapter to convert IntelReportUI and IntelItemUI to Event format
 */
export const adaptReportsToEvents = (reports: IntelReportUI[]): Event[] => {
  return reports.map(report => ({
    id: `evt-report-${report.id}`,
    title: report.title,
    timestamp: report.updatedAt.toISOString(),
    category: report.category || 'GENERAL',
    tags: report.tags,
    lat: report.latitude,
    lon: report.longitude,
    confidence: report.confidence,
    sourceType: 'REPORT',
    sourceId: report.id,
    entityRefs: [] // Could be extracted from content if needed
  }));
};

export const adaptIntelItemsToEvents = (intelItems: IntelItemUI[]): Event[] => {
  return intelItems.map(item => ({
    id: `evt-item-${item.id}`,
    title: item.title,
    timestamp: item.updatedAt.toISOString(),
    category: item.categories[0] || 'GENERAL',
    tags: item.tags,
    lat: item.latitude,
    lon: item.longitude,
    confidence: item.confidence,
    sourceType: 'INTEL_ITEM',
    sourceId: item.id,
    entityRefs: [] // Could be extracted from content if needed
  }));
};

/**
 * Combine and sort events from both sources
 */
export const adaptWorkspaceToEvents = (reports: IntelReportUI[], intelItems: IntelItemUI[]): Event[] => {
  const reportEvents = adaptReportsToEvents(reports);
  const itemEvents = adaptIntelItemsToEvents(intelItems);
  const allEvents = [...reportEvents, ...itemEvents];

  // Sort by timestamp descending (newest first)
  return allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
