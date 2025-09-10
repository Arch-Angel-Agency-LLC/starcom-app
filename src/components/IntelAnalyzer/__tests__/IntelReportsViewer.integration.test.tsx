import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IntelWorkspaceProvider } from '../../../services/intel/IntelWorkspaceContext';
import { intelReportService } from '../../../services/intel/IntelReportService';
import IntelReportsViewer from '../IntelReportsViewer';

// Minimal integration: create → render → edit → persist

describe('IntelReportsViewer integration', () => {
  beforeEach(() => {
    // Ensure a clean workspace for each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('renders provider data, shows created report, and reflects edits', async () => {
    render(
      <IntelWorkspaceProvider>
        <IntelReportsViewer />
      </IntelWorkspaceProvider>
    );

    // Initially should show empty list count
    await screen.findByText(/Intelligence Reports \(0\)/i);

    // Create a report via the service (provider listens to workspace manager)
    const created = await intelReportService.createReport({
      title: 'Test Report A',
      content: 'Body A',
      category: 'report',
      tags: ['alpha', 'beta'],
      classification: 'UNCLASSIFIED'
    }, 'tester');

    // Viewer should reflect the new report
    await screen.findByText('Test Report A');
    await screen.findByText(/Intelligence Reports \(1\)/i);

    // Edit title and save via service
    const updated = { ...created, title: 'Updated Report A' };
    await intelReportService.saveReport(updated);

    // Viewer should reflect the updated title
    await screen.findByText('Updated Report A');
  });
});
