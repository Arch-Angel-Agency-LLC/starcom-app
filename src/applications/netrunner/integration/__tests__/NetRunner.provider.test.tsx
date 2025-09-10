import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IntelWorkspaceProvider, useIntelWorkspace } from '../../../../services/intel/IntelWorkspaceContext';
import { intelReportService } from '../../../../services/intel/IntelReportService';

// Minimal NetRunner consumer component that lists report titles from provider
const NetRunnerReportList: React.FC = () => {
  const { reports, loading } = useIntelWorkspace();
  if (loading) return <div>Loading NetRunner Reports...</div>;
  return (
    <ul data-testid="nr-report-list">
      {reports.map(r => <li key={r.id}>{r.title}</li>)}
    </ul>
  );
};

describe('NetRunner provider integration (IntelWorkspaceProvider)', () => {
  it('renders reports created via intelReportService (provider sourced)', async () => {
    await intelReportService.createReport({
      title: 'NR Provider R1',
      content: 'Content 1',
      category: 'GENERAL',
      tags: ['nr','p1'],
      classification: 'UNCLASSIFIED'
    }, 'NetRunnerUser');
    await intelReportService.createReport({
      title: 'NR Provider R2',
      content: 'Content 2',
      category: 'THREAT',
      tags: ['nr','p2'],
      classification: 'UNCLASSIFIED',
      latitude: 5,
      longitude: 7
    }, 'NetRunnerUser');

    render(
      <IntelWorkspaceProvider>
        <NetRunnerReportList />
      </IntelWorkspaceProvider>
    );

    await waitFor(async () => {
      expect(await screen.findByText('NR Provider R1')).toBeTruthy();
      expect(await screen.findByText('NR Provider R2')).toBeTruthy();
    });

    const list = screen.getByTestId('nr-report-list');
    expect(list.querySelectorAll('li').length).toBeGreaterThanOrEqual(2);
  });
});
