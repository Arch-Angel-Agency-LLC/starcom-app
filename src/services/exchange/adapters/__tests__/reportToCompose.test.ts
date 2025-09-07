import { describe, it, expect } from 'vitest';
import { composeInputFromDraft } from '../reportToCompose';
import type { IntelReportUI } from '../../../../types/intel/IntelReportUI';

describe('composeInputFromDraft', () => {
  it('maps IntelReportUI to ComposeInput correctly', () => {
    const report: IntelReportUI = {
      id: 'intel-123',
      title: 'Test Draft',
      content: 'Full content',
      summary: 'Short summary',
      author: 'Analyst',
      category: 'TEST',
      tags: ['a', 'b'],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      analysisDeepLink: 'app://intel?from=intelanalyzer&draft=intel-123'
    };

    const input = composeInputFromDraft(report);
    expect(input.name).toBe('Test Draft');
    expect(input.description).toBe('Short summary');
    expect(input.classification).toBe('UNCLASSIFIED');
    expect(input.license).toBe('OPEN');
    expect(input.author).toBe('Analyst');
    expect(input.analysisDeepLink).toBe(report.analysisDeepLink);
    expect(input.reports).toHaveLength(1);
    expect(input.reports[0]).toEqual({ id: 'intel-123', title: 'Test Draft', content: 'Full content' });
    expect(input.intel).toEqual([]);
    expect(input.assets).toEqual([]);
  });
});
