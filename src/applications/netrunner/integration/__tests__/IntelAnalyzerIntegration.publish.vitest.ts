import { describe, it, expect, beforeEach } from 'vitest';
import { basicIntelWorkflows, createWorkflowFromTemplate, publishIntelReportFromWorkflow } from '../IntelAnalyzerIntegration';
import { intelReportService } from '../../../../services/intel/IntelReportService';

function resetWorkspace() {
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
}

describe('NetRunner → Analyzer publish integration (headless)', () => {
  beforeEach(resetWorkspace);

  it('publishes a workflow-derived report and lists it via intelReportService', async () => {
    const template = basicIntelWorkflows[0];
    const wf = createWorkflowFromTemplate(template, 'Workflow A', 'Desc');
    const created = await publishIntelReportFromWorkflow(wf, 'tester', 'Tester');
    expect(created.title).toBe('Workflow A');

    const list = await intelReportService.listReports();
    expect(list.some(r => r.title === 'Workflow A')).toBe(true);
  });
});
