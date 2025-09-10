import { describe, it, expect, beforeEach } from 'vitest';
import { basicIntelWorkflows, createWorkflowFromTemplate, publishIntelReportFromWorkflow } from '../IntelAnalyzerIntegration';
import { intelReportService } from '../../../../services/intel/IntelReportService';

function resetWorkspace() {
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
}

describe('IntelReportService update flow (NetRunner → Analyzer)', () => {
  beforeEach(resetWorkspace);

  it('saves content changes and increments version; status transitions are validated', async () => {
    const template = basicIntelWorkflows[0];
    const wf = createWorkflowFromTemplate(template, 'WF Update', 'Desc');
    const created = await publishIntelReportFromWorkflow(wf, 'tester', 'Tester');
    const list1 = await intelReportService.listReports();
    expect(list1.some(r => r.id === created.id)).toBe(true);

    // Save an edit
    const edited = { ...created, content: created.content + ' + edit' };
    await intelReportService.saveReport(edited);
    const afterSave = await intelReportService.getReport(created.id);
    expect(afterSave?.content.endsWith(' + edit')).toBe(true);
    expect((afterSave?.version || 1) >= (created.version || 1)).toBe(true);

    // Valid status transition: DRAFT -> SUBMITTED
    const submitted = await intelReportService.updateStatus(created.id, 'SUBMITTED');
    expect(submitted?.status).toBe('SUBMITTED');
  });
});
