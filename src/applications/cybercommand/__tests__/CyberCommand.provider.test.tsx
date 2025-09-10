import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
// NOTE: Full CyberCommandApplication mounting pulls in many nested providers (UnifiedGlobalCommandProvider,
// GlobeProvider, VisualizationModeProvider, etc.) making a lightweight provider test brittle.
// This test focuses on verifying that reports seeded via intelReportService are exposed through
// IntelWorkspaceProvider in a "CyberCommand context" placeholder probe. A fuller integration
// (with visualization/tasking) will be added once provider chains are refactored for testability.
import { IntelWorkspaceProvider, useIntelWorkspace } from '../../../services/intel/IntelWorkspaceContext';
import { intelReportService } from '../../../services/intel/IntelReportService';

// Lightweight probe component to assert provider delivers intel reports
const Probe: React.FC = () => {
  const { reports, loading } = useIntelWorkspace();
  return <div data-testid="probe-status">{loading ? 'LoadingReports' : `ReportsLoaded: ${reports.length}`}</div>;
};

describe('CyberCommand provider integration (IntelWorkspaceProvider)', () => {
  it('exposes intelReportService seeded reports within provider while CyberCommandApplication renders', async () => {
    // Determine baseline (other tests may have seeded reports earlier in the run)
    const baseline = (await intelReportService.listReports()).length;
    // Seed two additional reports
    await intelReportService.createReport({
      title: 'CC Report A', content: 'Alpha', category: 'GENERAL', tags: ['cc','a'], classification: 'UNCLASSIFIED'
    }, 'CyberUser');
    await intelReportService.createReport({
      title: 'CC Report B', content: 'Bravo', category: 'THREAT', tags: ['cc','b'], classification: 'UNCLASSIFIED'
    }, 'CyberUser');

    render(
      <IntelWorkspaceProvider>
        <Probe />
      </IntelWorkspaceProvider>
    );

  // Expect baseline + 2 new reports
  const expected = baseline + 2;
  await screen.findByText(new RegExp(`ReportsLoaded: ${expected}`));
  });
});
