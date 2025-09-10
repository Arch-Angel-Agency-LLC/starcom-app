import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntelWorkspaceProvider } from '../../../../services/intel/IntelWorkspaceContext';
import { basicIntelWorkflows, createWorkflowFromTemplate, publishIntelReportFromWorkflow } from '../IntelAnalyzerIntegration';
import { intelReportService } from '../../../../services/intel/IntelReportService';

function resetWorkspace() {
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
}

function ReportsList() {
  const [reports, setReports] = React.useState<any[]>([]);
  React.useEffect(() => {
    let unsub: undefined | (() => void);
    intelReportService.listReports().then(setReports);
    unsub = intelReportService.onChange(setReports);
    return () => { if (unsub) unsub(); };
  }, []);
  return (<div>Reports: {reports.length}</div>);
}

describe('NetRunner → Analyzer publish integration', () => {
  beforeEach(resetWorkspace);

  it('publishes a workflow-derived report via intelReportService and lists it in provider', async () => {
    const template = basicIntelWorkflows[0];
    const wf = createWorkflowFromTemplate(template, 'Workflow A', 'Desc');
    const created = await publishIntelReportFromWorkflow(wf, 'tester', 'Tester');
    expect(created.title).toBe('Workflow A');

    render(
      <IntelWorkspaceProvider>
        <ReportsList />
      </IntelWorkspaceProvider>
    );

    await screen.findByText('Reports: 1');
  });
});
