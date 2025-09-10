/**
 * NetRunner Intel Report Model
 * 
 * Defines the structure and functionality of Intel Reports within the NetRunner ecosystem.
 * This model bridges the gap between raw OSINT data and structured intelligence.
 * 
 * @author GitHub Copilot
 * @date July 18, 2025
 */

import { intelReportService } from '../../../services/intel/IntelReportService';
import { type CreateIntelReportInput, type IntelReportUI } from '../../../types/intel/IntelReportUI';
import type { BotIntelReport, BotIntelOutput } from '../types/BotMission';

export interface IntelEntity {
  id: string;
  type: 'person' | 'organization' | 'location' | 'asset' | 'event' | 'technology' | 'contact';
  name: string;
  description?: string;
  confidence: number;
  metadata: Record<string, unknown>;
  attributes: Record<string, unknown>;
  // Backwards compatibility for older adapters/tests
  properties?: Record<string, unknown>;
  relationships: IntelRelationship[];
}

export interface IntelRelationship {
  id: string;
  type: 'connected_to' | 'owns' | 'controls' | 'located_at' | 'works_for' | 'uses' | 'related_to';
  sourceId: string;
  targetId: string;
  confidence: number;
  metadata: Record<string, unknown>;
  /**
   * Deprecated aliases for backward compatibility with older adapters/tests.
   * Prefer using sourceId and targetId.
   */
  source?: string;
  target?: string;
}

export interface Evidence {
  id: string;
  type: 'document' | 'image' | 'screenshot' | 'log' | 'scan_result' | 'api_response';
  description: string;
  source: string;
  timestamp: Date;
  content: string | object;
  metadata: Record<string, unknown>;
}


// Build CreateIntelReportInput directly for NetRunner flows (replaces legacy NetRunnerIntelReport + builder)
export function buildCreateIntelReportInput(params: {
  title: string; content: string; summary?: string; category?: string; tags?: string[]; latitude?: number; longitude?: number; confidence?: number; keyFindings?: string[];
}): CreateIntelReportInput {
  return {
    title: params.title,
    content: params.content,
    summary: params.summary || '',
    category: params.category || 'general',
    tags: params.tags || [],
    classification: 'UNCLASSIFIED',
    status: 'DRAFT',
    latitude: params.latitude,
    longitude: params.longitude,
    conclusions: params.keyFindings || [],
    recommendations: [],
    methodology: [],
    confidence: typeof params.confidence === 'number' ? Math.max(0, Math.min(1, params.confidence)) : undefined,
    targetAudience: [],
    sourceIntelIds: []
  };
}

// Adapter: map a BotIntelReport to CreateIntelReportInput
export function toCreateIntelReportInputFromBot(report: BotIntelReport): CreateIntelReportInput {
  const category = report.reportType || 'general';
  return {
    title: report.title,
    content: report.content,
    summary: report.summary,
    category,
    tags: [],
    classification: 'UNCLASSIFIED',
    status: 'DRAFT',
    conclusions: report.keyFindings || [],
    recommendations: report.recommendations || [],
    methodology: [],
    confidence: undefined,
    targetAudience: report.targetAudience || [],
    sourceIntelIds: report.sourceIntel || []
  };
}

// Publish all BotIntelReport entries from a BotIntelOutput to the centralized Intel system
export async function publishBotIntelOutput(output: BotIntelOutput, authorDisplayName?: string): Promise<IntelReportUI[]> {
  const author = authorDisplayName || output.botId;
  const created: IntelReportUI[] = [];
  for (const r of output.reports || []) {
    const input = toCreateIntelReportInputFromBot(r);
    const ui = await intelReportService.createReport(input, author);
    created.push(ui);
  }
  // Phase 2 -> 3 migration aid: attach canonical reports to original output for downstream consumers
  try {
    // Mutate output object (safe - caller owns object) to include canonical linkage
    (output as BotIntelOutput & { publishedReports?: IntelReportUI[]; publishedAt?: Date }).publishedReports = created;
    (output as BotIntelOutput & { publishedReports?: IntelReportUI[]; publishedAt?: Date }).publishedAt = new Date();
  } catch { /* ignore mutation errors */ }
  return created;
}

// Helper for downstream consumers: prefer canonical publishedReports when available,
// otherwise fall back to local lightweight bot reports (pre-publish state). This
// supports Phase 2 -> 3 migration where some components still iterate `reports`.
export function getBotOutputCanonicalReports(output: BotIntelOutput & { publishedReports?: IntelReportUI[] }): IntelReportUI[] {
  if (output.publishedReports && output.publishedReports.length) return output.publishedReports;
  // No canonical published yet: provide empty (callers should tolerate and maybe trigger publish)
  return [];
}
