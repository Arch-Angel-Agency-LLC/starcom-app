import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { IntelWorkspaceProvider } from '../../../services/intel/IntelWorkspaceContext';
import { intelReportService } from '../../../services/intel/IntelReportService';
import IntelReportsViewer from '../IntelReportsViewer';

const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <IntelWorkspaceProvider>{children}</IntelWorkspaceProvider>
);

describe('IntelReportsViewer (provider → intel-ui path)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
  });

  it('renders reports created via intelReportService (provider sourced)', async () => {
    await act(async () => {
      await intelReportService.createReport({
        title: 'Viewer Test A',
        content: 'Body A',
        category: 'report',
        tags: ['a'],
        classification: 'UNCLASSIFIED',
        status: 'DRAFT'
      }, 'tester');
      await intelReportService.createReport({
        title: 'Viewer Test B',
        content: 'Body B',
        category: 'report',
        tags: ['b'],
        classification: 'UNCLASSIFIED',
        status: 'DRAFT'
      }, 'tester');
    });

  render(<Wrap><IntelReportsViewer /></Wrap>);
    // Expect titles to appear (list mode default)
    expect(await screen.findByText('Viewer Test A')).toBeTruthy();
    expect(await screen.findByText('Viewer Test B')).toBeTruthy();
  });
});
