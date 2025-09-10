/**
 * GraphView Live Updates Provider Integration Test
 *
 * Ensures GraphView reflects newly created reports after initial render via
 * IntelWorkspaceProvider subscription (live context updates).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

// Mock force graph canvas to avoid canvas API in jsdom
vi.mock('react-force-graph-2d', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="force-graph-mock-live">
      {props.graphData?.nodes?.map((n: any) => (
        <div key={n.id}>{n.label || n.id}</div>
      ))}
    </div>
  )
}));

import { IntelWorkspaceProvider } from '../../../../../services/intel/IntelWorkspaceContext';
import { FilterProvider } from '../../../state/FilterContext';
import { SelectionProvider } from '../../../state/SelectionContext';
import { CorrelationProvider } from '../../../state/CorrelationContext';
import { intelReportService } from '../../../../../services/intel/IntelReportService';
import GraphView from '../GraphView';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <IntelWorkspaceProvider>
      <FilterProvider>
        <SelectionProvider>
          <CorrelationProvider>
            {children}
          </CorrelationProvider>
        </SelectionProvider>
      </FilterProvider>
    </IntelWorkspaceProvider>
  );
}

describe('GraphView provider live updates integration', () => {
  it('adds a new event node when a report is created after initial render', async () => {
    // Seed initial report BEFORE render
    await intelReportService.createReport({
      title: 'Graph Live R1',
      summary: 'Live R1 summary',
      content: 'Live R1 content',
      classification: 'UNCLASSIFIED',
      category: 'GENERAL',
      tags: ['live','graph'],
      confidence: 0.4
    }, 'Tester');

    render(<GraphView />, { wrapper: Wrapper });

    // Confirm first report node present
    await waitFor(() => {
      expect(screen.getByText('Graph Live R1')).toBeTruthy();
    });

    // Create second report AFTER render to test live subscription propagation
    await act(async () => {
      await intelReportService.createReport({
        title: 'Graph Live R2',
        summary: 'Live R2 summary',
        content: 'Live R2 content',
        classification: 'UNCLASSIFIED',
        category: 'GENERAL',
        tags: ['live','graph'],
        confidence: 0.55
      }, 'Tester');
    });

    // Assert new node appears without re-mounting GraphView
    await waitFor(() => {
      expect(screen.getByText('Graph Live R2')).toBeTruthy();
    });
  });
});
