import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import AnomalyBadge from '../AnomalyBadge';

// Lightweight mock for MUI Chip
vi.mock('@mui/material', () => {
  const React = require('react');
  const Chip = ({ label, ...props }: any) => React.createElement('span', { 'data-testid': props['data-testid'], ...props }, label);
  return { Chip };
});

describe('AnomalyBadge', () => {
  it('renders when date key is anomalous and toggle is on', () => {
    const anomalies = new Set(['2024-01-02']);
    render(<AnomalyBadge timestamp={'2024-01-02T00:00:00Z'} anomaliesByDay={anomalies} showClusters={true} />);
    const badge = screen.getByTestId('inspector-anomaly-badge');
    expect(badge).toBeTruthy();
  });

  it('does not render when toggle is off', () => {
    const anomalies = new Set(['2024-01-02']);
    render(<AnomalyBadge timestamp={'2024-01-02T00:00:00Z'} anomaliesByDay={anomalies} showClusters={false} />);
    expect(screen.queryByTestId('inspector-anomaly-badge')).toBeNull();
  });

  it('does not render when date is not anomalous', () => {
    const anomalies = new Set(['2024-01-03']);
    render(<AnomalyBadge timestamp={'2024-01-02T00:00:00Z'} anomaliesByDay={anomalies} showClusters={true} />);
    expect(screen.queryByTestId('inspector-anomaly-badge')).toBeNull();
  });
});
