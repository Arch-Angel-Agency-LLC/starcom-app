/**
 * GraphView Provider Integration Test
 *
 * Verifies that GraphView consumes reports via useIntelWorkspace (provider)
 * and renders corresponding event nodes (titles) based on created reports.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock force graph canvas component to avoid HTMLCanvas getContext issues in jsdom
vi.mock('react-force-graph-2d', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="force-graph-mock">
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

describe('GraphView provider integration', () => {
  beforeEach(() => {
    // (If a reset API is added later we would call it here.)
  });

  it('renders event nodes for reports created via intelReportService', async () => {
    await intelReportService.createReport({
      title: 'Graph Report Alpha',
      summary: 'Alpha summary',
      content: 'Alpha content',
      classification: 'UNCLASSIFIED',
      category: 'GENERAL',
      tags: ['alpha','graph'],
      confidence: 0.5
    }, 'Tester');
    await intelReportService.createReport({
      title: 'Graph Report Beta',
      summary: 'Beta summary',
      content: 'Beta content',
      classification: 'UNCLASSIFIED',
      category: 'GENERAL',
      tags: ['beta','graph'],
      confidence: 0.6
    }, 'Tester');

    render(<GraphView />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Graph Report Alpha')).toBeTruthy();
      expect(screen.getByText('Graph Report Beta')).toBeTruthy();
    });
  });
});
