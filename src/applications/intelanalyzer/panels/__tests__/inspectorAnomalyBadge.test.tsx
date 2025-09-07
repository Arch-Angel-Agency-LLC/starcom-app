import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnomalyBadge from '../components/AnomalyBadge';

describe('InspectorPanel anomaly badge', () => {
  it('shows anomaly badge when selected event falls on an anomalous day and toggle is on', () => {
    const anomalies = new Set(['2024-01-02']);
    render(<AnomalyBadge timestamp={'2024-01-02T10:00:00Z'} anomaliesByDay={anomalies} showClusters={true} />);
    const badge = screen.getByTestId('inspector-anomaly-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Anomaly');
  });
});
