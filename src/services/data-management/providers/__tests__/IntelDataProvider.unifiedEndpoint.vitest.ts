import { describe, it, expect, beforeEach } from 'vitest';
import { IntelDataProvider } from '../IntelDataProvider';
import { intelReportService } from '../../../intel/IntelReportService';
import type { CreateIntelReportInput } from '../../../../types/intel/IntelReportUI';

function makeInput(overrides: Partial<CreateIntelReportInput> = {}): CreateIntelReportInput {
  return {
    title: overrides.title || 'Unified Endpoint Report',
    content: overrides.content || 'Body',
    summary: overrides.summary || 'Summary',
    category: overrides.category || 'general',
    tags: overrides.tags || ['unified'],
    classification: overrides.classification || 'UNCLASSIFIED',
    status: overrides.status || 'DRAFT',
    conclusions: overrides.conclusions || [],
    recommendations: overrides.recommendations || [],
    methodology: overrides.methodology || [],
    confidence: overrides.confidence,
    latitude: overrides.latitude,
    longitude: overrides.longitude,
    priority: overrides.priority,
    targetAudience: overrides.targetAudience || [],
    sourceIntelIds: overrides.sourceIntelIds || []
  };
}

function resetWorkspace() {
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
}

describe('IntelDataProvider unified intel-ui endpoint', () => {
  beforeEach(() => {
    resetWorkspace();
  });

  it('returns reports created via intelReportService when fetching intel-ui', async () => {
    // Arrange: create two reports through canonical service
    const r1 = await intelReportService.createReport(makeInput({ title: 'UI Fetch R1' }), 'tester');
    const r2 = await intelReportService.createReport(makeInput({ title: 'UI Fetch R2', tags: ['x','y'] }), 'tester');

    const provider = new IntelDataProvider();

    // Act
    const data = await provider.fetchData('intel-ui');

    // Assert
    expect(Array.isArray(data)).toBe(true);
    const list = data as any[];
    // At least the two we just created should be present (possible placeholder or pre-existing ones may also exist)
    const titles = list.map(r => r.title);
    expect(titles).toContain(r1.title);
    expect(titles).toContain(r2.title);
    const fetchedR1 = list.find(r => r.id === r1.id);
    expect(fetchedR1.status).toBe('DRAFT');
    expect(fetchedR1.classification).toBe('UNCLASSIFIED');
  });

  it('falls back gracefully (still returns array) if service listReports throws (simulated)', async () => {
    resetWorkspace();
    // Simulate absence by temporarily monkey patching listReports
    const original = (intelReportService as any).listReports;
    (intelReportService as any).listReports = async () => { throw new Error('simulated failure'); };
    try {
      const provider = new IntelDataProvider();
      const data = await provider.fetchData('intel-ui');
      expect(Array.isArray(data)).toBe(true);
      const list = data as any[];
      expect(list.length).toBeGreaterThan(0); // placeholder fallback
    } finally {
      (intelReportService as any).listReports = original;
    }
  });
});
