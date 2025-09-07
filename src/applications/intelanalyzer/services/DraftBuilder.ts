import type { BoardState, PinnedItem } from '../state/BoardsTypes';
import type { IntelReportUI, IntelClassification } from '../../../types/intel/IntelReportUI';
import { encodeDeepLink, encodeFilters } from '../utils/deepLink';

export interface DraftExportOptions {
  title: string;
  classification: IntelClassification;
  includeFilters?: boolean;
  includeWatchlists?: boolean;
  redactSensitive?: boolean;
}

export interface DraftBuildResult {
  report: Omit<IntelReportUI, 'id' | 'author' | 'createdAt' | 'updatedAt'>;
  citations: DraftCitation[];
}

export type DraftCitation = {
  id: string;
  type: PinnedItem['type'];
  title?: string;
  sourceType?: 'REPORT' | 'INTEL_ITEM' | 'EVENT' | 'ENTITY';
  sourceId?: string;
  timestamp?: string; // ISO
  tags?: string[];
  entities?: string[];
};

/**
 * DraftBuilder
 * Maps a Board snapshot into a Draft Report payload (IntelReportUI shape) plus citations.
 * Notes are used as the opening Summary section; pins become Evidence citations.
 * Watchlists can be reflected into tags for quick context if requested.
 */
export class DraftBuilder {
  static buildFromBoard(board: BoardState, opts: DraftExportOptions): DraftBuildResult {
    const watch = board.state.watch || { entities: [], tags: [] };
    const pins = (board.state.pins || []) as PinnedItem[];
    const notes = board.state.notes || '';

    const citations: DraftCitation[] = pins.map(p => ({
      id: p.id,
      type: p.type,
      title: p.title,
      // Placeholders for richer fields (available when pins include richer data)
      sourceType: p.type === 'report' ? 'REPORT' : p.type === 'intelItem' ? 'INTEL_ITEM' : p.type === 'event' ? 'EVENT' : 'ENTITY',
      sourceId: p.id
    }));

    // Basic content scaffold
    // Keep plaintext/markdown, safe to store as content.
    const sections: string[] = [];
    if (notes) {
      sections.push(`# Summary\n\n${notes.trim()}`);
    } else {
      sections.push(`# Summary\n\nDraft created from board "${board.name}".`);
    }

    // Evidence section
    sections.push('## Evidence');
    if (citations.length === 0) {
      sections.push('- No pinned evidence');
    } else {
      citations.forEach(c => {
        sections.push(`- [${c.type}] ${c.title || c.id} (id: ${c.id})`);
      });
    }

    // Optional context
    if (opts.includeFilters) {
      sections.push('\n## Context: Active Filters');
      try {
        const json = JSON.stringify(board.state.filters);
        sections.push('```json');
        sections.push(json);
        sections.push('```');
      } catch {
        // ignore
      }
    }
    // Determine classification enforcement
    const forceRedact = opts.redactSensitive || (opts.classification === 'CONFIDENTIAL');

    const allowWatchlistsSection = opts.includeWatchlists && opts.classification !== 'UNCLASSIFIED';
    if (allowWatchlistsSection) {
      sections.push('\n## Context: Watchlists');
      if ((watch.tags?.length || 0) > 0) sections.push(`- Tags: ${watch.tags!.join(', ')}`);
      if ((watch.entities?.length || 0) > 0) {
        if (forceRedact) {
          sections.push(`- Entities: [REDACTED]`);
        } else {
          sections.push(`- Entities: ${watch.entities!.join(', ')}`);
        }
      }
      if ((watch.tags?.length || 0) === 0 && (watch.entities?.length || 0) === 0) sections.push('- None');
    }

    // Derive report fields
    const now = new Date();
    const content = sections.join('\n');

  // Tags: include watch tags when opted in and classification allows
  // Allow tags for CONFIDENTIAL and above; suppress at UNCLASSIFIED
  const tags = (opts.includeWatchlists && opts.classification !== 'UNCLASSIFIED') ? [...(watch.tags || [])] : [];

    // Compute analysis deep-link for round-trip
    const deepLink = encodeDeepLink({
      view: board.state.view,
      board: board.id,
      filters: encodeFilters(board.state.filters)
    });

    const report: Omit<IntelReportUI, 'id' | 'author' | 'createdAt' | 'updatedAt'> = {
      title: opts.title || board.name || 'Draft Report',
      content,
      summary: notes ? notes.slice(0, 240) : `Draft created from board "${board.name}" on ${now.toLocaleString()}.`,
      category: 'GENERAL',
      tags,
      classification: opts.classification,
      status: 'DRAFT',
      conclusions: [],
      recommendations: [],
      methodology: [],
      confidence: undefined,
      priority: 'ROUTINE',
      targetAudience: [],
      sourceIntelIds: [],
      version: 1,
      manualSummary: !!notes,
      history: [],
      analysisDeepLink: deepLink
    };

  // Redaction (basic): if requested or enforced by classification, scrub entities list in content
  if ((opts.redactSensitive || opts.classification === 'CONFIDENTIAL') && opts.includeWatchlists) {
      report.content = report.content.replace(/(Entities:\s*)(.*)/, '$1[REDACTED]');
    }

    return { report, citations };
  }
}

export default DraftBuilder;
