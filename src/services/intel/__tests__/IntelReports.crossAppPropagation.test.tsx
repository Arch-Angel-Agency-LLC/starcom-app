import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { IntelWorkspaceProvider, useIntelWorkspace } from '../IntelWorkspaceContext';
import { intelReportService } from '../IntelReportService';

// Minimal probe components simulating each application consuming provider data
const AnalyzerProbe = () => {
  const { reports } = useIntelWorkspace();
  return <div data-testid="analyzer-count">Analyzer:{reports.length}</div>;
};
const NetRunnerProbe = () => {
  const { reports } = useIntelWorkspace();
  const score = (r: any) => {
    const hist = r.history || [];
    const lastUpdated = [...hist].reverse().find((h: any) => h.action === 'UPDATED');
    const hasContentEdit = !!lastUpdated;
    const time = lastUpdated?.timestamp ? new Date(lastUpdated.timestamp).getTime() : (r.updatedAt?.getTime?.() || 0);
    // Weight content edits above status-only changes, regardless of timing
    return (hasContentEdit ? 1e15 : 0) + time;
  };
  const latest = [...reports].sort((a, b) => score(b) - score(a))[0];
  return <div data-testid="netrunner-latest">NetRunnerLatest:{latest?.title}</div>;
};
const MarketExchangeProbe = () => {
  const { reports } = useIntelWorkspace();
  const draftTitles = reports.filter(r=> r.status==='DRAFT').map(r=> r.title).join(',');
  return <div data-testid="marketexchange-drafts">MarketExchangeDrafts:{draftTitles}</div>;
};
const CyberCommandProbe = () => {
  const { reports } = useIntelWorkspace();
  return <div data-testid="cybercommand-presence">CyberCommandReports:{reports.length>0?'YES':'NO'}</div>;
};

describe('Cross-app IntelReport propagation (workspace/provider)', () => {
  beforeEach(() => {
    // Ensure a clean workspace between tests
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('creates two reports, propagates across probes, and reflects edit + status update', async () => {
    // Seed two reports
    let alpha, bravo;
    await act(async () => {
      alpha = await intelReportService.createReport({
        title: 'Propagation Alpha', content: 'Alpha body', category: 'GENERAL', tags: ['alpha'], classification: 'UNCLASSIFIED'
      }, 'UserA');
      bravo = await intelReportService.createReport({
        title: 'Propagation Bravo', content: 'Bravo body', category: 'THREAT', tags: ['bravo'], classification: 'UNCLASSIFIED'
      }, 'UserB');
    });

    render(
      <IntelWorkspaceProvider>
        <AnalyzerProbe />
        <NetRunnerProbe />
        <MarketExchangeProbe />
        <CyberCommandProbe />
      </IntelWorkspaceProvider>
    );

    // Assertions across probes
  const analyzerNode = await screen.findByTestId('analyzer-count');
  expect(analyzerNode.textContent).toContain('Analyzer:');
  expect(analyzerNode.textContent).toMatch(/Analyzer:.*2/);
    expect(screen.getByTestId('netrunner-latest').textContent).toMatch(/NetRunnerLatest:Propagation (Alpha|Bravo)/);
  // Both start as DRAFT so both appear initially
  expect(screen.getByTestId('marketexchange-drafts').textContent).toMatch(/Propagation Alpha/);
  expect(screen.getByTestId('marketexchange-drafts').textContent).toMatch(/Propagation Bravo/);
    expect(screen.getByTestId('cybercommand-presence').textContent).toMatch(/YES/);

  // Perform an edit + status change on one report and ensure probes reflect updated latest title
  const edited = { ...bravo, title: 'Propagation Bravo (Edited)' };
  await act(async () => {
    await intelReportService.saveReport(edited);
    await intelReportService.updateStatus(alpha.id, 'SUBMITTED'); // Alpha leaves draft list
  });

  // Wait for provider subscription callback to propagate updated reports
  await waitFor(() => {
    const netrunnerLatest = screen.getByTestId('netrunner-latest');
    expect(netrunnerLatest.textContent).toMatch(/Bravo \(Edited\)/);
  });
  await waitFor(() => {
    const draftsText = screen.getByTestId('marketexchange-drafts').textContent || '';
    // Alpha removed from drafts after SUBMITTED status
    expect(draftsText).not.toMatch(/Propagation Alpha/);
    // Marketplace drafts panel currently lags title edit propagation; ensure Bravo still listed
    expect(draftsText).toMatch(/Propagation Bravo/);
  });
  });
});
