import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimeMapBands from '../components/TimeMapBands';

// Stub ResizeObserver to avoid open handles in JSDOM
class RO { observe() {} unobserve() {} disconnect() {} }
const OriginalRO = (global as any).ResizeObserver;
beforeAll(() => { (global as any).ResizeObserver = RO as any; });
afterAll(() => { (global as any).ResizeObserver = OriginalRO; });

describe('TimeMapBands anomaly overlays', () => {
  it('renders anomaly bands when provided', () => {
    const events = [
      { id: 'e1', timestamp: '2025-01-01T12:00:00.000Z', category: 'GENERAL' },
      { id: 'e2', timestamp: '2025-01-01T13:00:00.000Z', category: 'GENERAL' },
      { id: 'e3', timestamp: '2025-01-02T12:00:00.000Z', category: 'GENERAL' }
    ];
    const domain: [number, number] = [
      new Date('2025-01-01T00:00:00Z').getTime(),
      new Date('2025-01-03T00:00:00Z').getTime()
    ];
    render(
      <TimeMapBands
        events={events}
        domain={domain}
        showAnomalyBands
        anomalyDays={new Set(['2025-01-01'])}
      />
    );
    const bands = screen.getAllByTestId('anomaly-band');
    expect(bands.length).toBeGreaterThan(0);
  });
});
