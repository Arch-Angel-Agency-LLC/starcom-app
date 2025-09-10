import { describe, it, expect } from 'vitest';
import { intelReportService } from '../../../intel/IntelReportService';
import { IntelRepositoryService } from '../../../IntelRepositoryService';
import { serializeReport } from '../intelReportSerialization';

describe('IntelRepositoryService canonical save (incremental Phase 4)', () => {
  it('writes schema v1 serialized report via saveCanonicalUIReport', async () => {
    const report = await intelReportService.createReport({
      title: 'Canonical Persist',
      content: 'Body',
      summary: 'Sum',
      category: 'general',
      tags: ['repo'],
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      conclusions: [],
      recommendations: [],
      methodology: [],
      confidence: 0.4,
      targetAudience: [],
      sourceIntelIds: []
    }, 'tester');

    const writes: Record<string, string> = {};
    const repo: any = new IntelRepositoryService('memory');
    repo.initialized = true; // force initialized for commit path
    repo.writeFile = async (p: string, c: string) => { writes[p] = c; };
    repo.execGit = async (args: string[]) => {
      if (args[0] === 'status') return 'M reports/x.intelReport';
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') return 'abc123canonical';
      return '';
    };
    repo.getChangedFiles = async () => Object.keys(writes);

    const result = await repo.saveCanonicalUIReport(report, 'Add canonical report');
    expect(result).toBeTruthy();
    const raw = writes[`reports/${report.id}.intelReport`];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw);
    expect(parsed.schema).toBe('intel.report');
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.id).toBe(report.id);
    expect(parsed.title).toBe('Canonical Persist');
    const standalone = serializeReport(report);
    expect(standalone.id).toBe(parsed.id);
  });
});
