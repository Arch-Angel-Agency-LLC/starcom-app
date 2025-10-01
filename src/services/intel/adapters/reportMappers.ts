import { IntelReportUI, IntelReportPriority, IntelReportHistoryEntry } from '../../../types/intel/IntelReportUI';
import { IntelReportData, IntelReportFile } from '../../../types/IntelWorkspace';

// Derive summary from content (first paragraph or first 240 chars)
export function deriveSummary(content: string): string {
  if (!content) return '';
  const firstPara = content.split(/\n\n+/)[0].trim();
  if (firstPara.length <= 240) return firstPara;
  return firstPara.slice(0, 237) + '...';
}

// Map UI report to workspace IntelReportData
export function uiToWorkspaceReportData(ui: IntelReportUI): IntelReportData {
  const summary = ui.manualSummary && ui.summary ? ui.summary : deriveSummary(ui.content);
  return {
    id: ui.id,
    title: ui.title,
    type: 'INTEL_REPORT',
    summary,
    content: ui.content,
    conclusions: ui.conclusions || [],
    recommendations: ui.recommendations || [],
    analysisType: ui.methodology && ui.methodology.length ? 'CUSTOM' : 'GENERAL',
    methodology: ui.methodology || [],
    confidence: ui.confidence ?? 0.5,
    priority: ui.priority || 'ROUTINE',
    sourceIntel: ui.sourceIntelIds || [],
    author: ui.author,
    contributors: [],
    createdAt: ui.createdAt.toISOString(),
    modifiedAt: ui.updatedAt.toISOString(),
    targetAudience: ui.targetAudience || [],
    distributionRestrictions: [],
    relatedReports: [],
    metadata: {
      status: ui.status,
      categories: ui.category ? [ui.category] : [],
      tags: ui.tags,
      geo: (ui.latitude !== undefined && ui.longitude !== undefined) ? { lat: ui.latitude, lon: ui.longitude } : undefined,
      version: ui.version ?? 1,
      manualSummary: ui.manualSummary || false,
      history: ui.history || [],
      analysisDeepLink: ui.analysisDeepLink
    }
  } as IntelReportData;
}

// Map workspace file to UI report
export function workspaceFileToUI(file: IntelReportFile): IntelReportUI {
  const d = file.reportData;
  type ReportMetadata = {
    status?: IntelReportUI['status'];
    categories?: string[];
    tags?: string[];
    geo?: { lat?: number; lon?: number };
    version?: number;
    manualSummary?: boolean;
    history?: IntelReportHistoryEntry[];
    analysisDeepLink?: string;
    [key: string]: unknown;
  };
  const metadata: ReportMetadata = (d.metadata || {}) as ReportMetadata;
  const geo = metadata.geo || {};
  const categories = Array.isArray(metadata.categories) ? metadata.categories : [];
  const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
  const history = Array.isArray(metadata.history) ? metadata.history : [];
  const version = typeof metadata.version === 'number' ? metadata.version : 1;
  const manualSummary = !!metadata.manualSummary;
  const status: IntelReportUI['status'] = metadata.status || 'DRAFT';
  const analysisDeepLink = typeof metadata.analysisDeepLink === 'string' ? metadata.analysisDeepLink : undefined;
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    summary: d.summary,
    author: d.author,
    category: (categories && categories[0]) || 'GENERAL',
    tags,
    latitude: geo.lat as number | undefined,
    longitude: geo.lon as number | undefined,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.modifiedAt),
    status,
    conclusions: d.conclusions || [],
    recommendations: d.recommendations || [],
    methodology: d.methodology || [],
    confidence: d.confidence,
    priority: d.priority as IntelReportPriority,
    targetAudience: d.targetAudience || [],
    sourceIntelIds: d.sourceIntel || [],
    version,
    manualSummary,
    history,
    analysisDeepLink
  };
}
