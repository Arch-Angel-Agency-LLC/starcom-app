/**
 * Intel Compatibility Adapter
 *
 * Provides lightweight migration utilities that convert legacy intel report
 * representations into the modern IntelReport3DData format consumed by
 * IntelReports3DService. The adapter favors resilience over strict validation
 * so that older cached payloads can still populate the 3D globe.
 */

import { Intel3DAdapter } from '../../services/adapters/Intel3DAdapter';
import type { IntelReport3DData } from '../../models/Intel/IntelVisualization3D';
import type { IntelReportData } from '../../models/IntelReportData';

export class IntelCompatibilityAdapter {
  static migrate(entry: unknown): IntelReport3DData | null {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    if (this.isIntelReport3DData(entry)) {
      return entry as IntelReport3DData;
    }

    if (this.isIntelReportData(entry)) {
      const normalized = this.normalizeIntelReportData(entry);
      return Intel3DAdapter.toIntelReport3D(normalized);
    }

    return null;
  }

  static batchMigrate(entries: unknown[]): IntelReport3DData[] {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries
      .map(entry => this.migrate(entry))
      .filter((item): item is IntelReport3DData => item !== null);
  }

  private static isIntelReport3DData(value: unknown): value is IntelReport3DData {
    const candidate = value as Partial<IntelReport3DData> | null;
    return !!candidate && typeof candidate === 'object' && 'visualization' in candidate;
  }

  private static isIntelReportData(value: unknown): value is IntelReportData {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<IntelReportData & { lat?: number; long?: number }>;
    const hasTitle = typeof candidate.title === 'string';
    const hasContent = typeof candidate.content === 'string';
    const hasTags = Array.isArray(candidate.tags);
    const hasLatitude = typeof candidate.latitude === 'number' || typeof candidate.lat === 'number';
    const hasLongitude = typeof candidate.longitude === 'number' || typeof candidate.long === 'number';

    return hasTitle && hasContent && hasTags && hasLatitude && hasLongitude;
  }

  private static normalizeIntelReportData(entry: Partial<IntelReportData> & { lat?: number; long?: number }): IntelReportData {
    const latitude = typeof entry.latitude === 'number' ? entry.latitude : entry.lat ?? 0;
    const longitude = typeof entry.longitude === 'number' ? entry.longitude : entry.long ?? 0;

    const timestampValue = typeof entry.timestamp === 'number'
      ? entry.timestamp
      : Date.now();

    return {
      id: entry.id || entry.pubkey || `legacy-${Date.now()}`,
      title: entry.title || 'Untitled Report',
      content: entry.content || entry.summary || '',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      latitude,
      longitude,
      timestamp: timestampValue,
      author: entry.author || 'unknown',
      priority: entry.priority,
      confidence: entry.confidence,
      categories: entry.categories,
      summary: entry.summary,
      visualization3D: entry.visualization3D,
      location3D: entry.location3D
    } as IntelReportData;
  }
}
