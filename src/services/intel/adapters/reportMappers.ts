import { IntelReportUI } from '../../../types/intel/IntelReportUI';
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
    classification: ui.classification,
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
      history: ui.history || []
    }
  } as IntelReportData;
}

// Map workspace file to UI report
export function workspaceFileToUI(file: IntelReportFile): IntelReportUI {
  const d = file.reportData;
  const metadata: any = d.metadata || {};
  const geo = metadata.geo || {};
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    summary: d.summary,
    author: d.author,
    category: (metadata.categories && metadata.categories[0]) || 'GENERAL',
    tags: metadata.tags || [],
    latitude: geo.lat,
    longitude: geo.lon,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.modifiedAt),
    classification: d.classification as any,
    status: metadata.status || 'DRAFT',
    conclusions: d.conclusions || [],
    recommendations: d.recommendations || [],
    methodology: d.methodology || [],
    confidence: d.confidence,
    priority: d.priority as any,
    targetAudience: d.targetAudience || [],
    sourceIntelIds: d.sourceIntel || [],
    version: metadata.version || 1,
    manualSummary: metadata.manualSummary || false,
    history: metadata.history || []
  };
}
