import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntelReportVisualizationService } from '../IntelReportVisualizationService';
import { intelReportService } from '../intel/IntelReportService';
import type { IntelReportUI } from '../../types/intel/IntelReportUI';

describe('IntelReportVisualizationService', () => {
  const svc = new IntelReportVisualizationService();
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    spy = vi.spyOn(intelReportService, 'listReports');
  });

  afterEach(() => {
    spy.mockRestore();
    svc.clearCache();
  });

  it('maps IntelReportUI from intelReportService into overlay markers', async () => {
    const now = new Date();
    const sample: IntelReportUI[] = [
      {
        id: 'ui-1',
        title: 'Sample A',
        content: 'Body A',
        summary: 'A',
        author: 'Tester',
        category: 'General',
        tags: ['TEST'],
        latitude: 10,
        longitude: 20,
        createdAt: now,
        updatedAt: now,
        classification: 'UNCLASSIFIED',
        status: 'DRAFT',
        version: 1,
        history: []
      }
    ];
    spy.mockResolvedValueOnce(sample);

    const markers = await svc.getIntelReportMarkers();
    expect(markers.length).toBe(1);
    expect(markers[0].pubkey).toBe('ui-1');
    expect(markers[0].title).toBe('Sample A');
    expect(markers[0].latitude).toBe(10);
    expect(markers[0].longitude).toBe(20);
    expect(markers[0].author).toBe('Tester');
  });
});
