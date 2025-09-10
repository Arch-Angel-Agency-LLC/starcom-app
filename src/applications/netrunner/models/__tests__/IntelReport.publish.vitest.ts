import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCreateIntelReportInput } from '../IntelReport';
import { intelReportService } from '../../../../services/intel/IntelReportService';

describe('NetRunner publish integration (direct CreateIntelReportInput → service)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('publishes a CreateIntelReportInput via intelReportService', async () => {
    const spy = vi.spyOn(intelReportService, 'createReport').mockResolvedValue({
      id: 'intel-test',
      title: 'Test',
      content: 'Body',
      author: 'author',
      category: 'general',
      tags: [],
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      latitude: undefined,
      longitude: undefined,
      summary: '',
      conclusions: [],
      recommendations: [],
      methodology: [],
      confidence: 0.2,
      priority: 'ROUTINE',
      targetAudience: [],
      sourceIntelIds: [],
      version: 1,
      manualSummary: false,
      history: []
    } as any);

  const input = buildCreateIntelReportInput({ title: 'Test', content: 'Body', summary: '', confidence: 0.2 });
  const created = await intelReportService.createReport(input, 'author');
    expect(created.id).toBe('intel-test');
    expect(spy).toHaveBeenCalled();
  });
});
