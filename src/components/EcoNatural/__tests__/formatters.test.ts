import { describe, it, expect } from 'vitest';
import { formatEcoDisasterTooltip, formatEcoDisasterLabel, formatUtcIsoShort } from '../formatters';

const baseEvent = {
  id: '1',
  lat: 0,
  lng: 0,
  type: 'earthquake',
  severityBucket: 'major' as const
};

describe('EcoNatural formatters', () => {
  it('formats tooltip with UTC time, magnitude, severity, and source', () => {
    const tooltip = formatEcoDisasterTooltip({
      ...baseEvent,
      magnitude: 5.234,
      timestamp: '2025-01-02T03:04:05Z',
      source: 'usgs'
    });

    expect(tooltip).toBe('M5.2 • earthquake • Severity: major • UTC 2025-01-02T03:04:05.000Z • Source: usgs');
  });

  it('includes mock disclaimer for volcano mock data', () => {
    const tooltip = formatEcoDisasterTooltip({
      ...baseEvent,
      type: 'volcano',
      severityBucket: 'minor',
      isMock: true,
      timestamp: '2025-01-02T03:04:05Z'
    });

    expect(tooltip).toContain('Mock volcano data');
  });

  it('formats label with magnitude and mock suffix', () => {
    const label = formatEcoDisasterLabel({
      ...baseEvent,
      type: 'volcano',
      magnitude: 4.0,
      severityBucket: 'major',
      isMock: true
    });

    expect(label).toBe('M4.0 volcano (mock)');
  });

  it('formats short UTC safely', () => {
    expect(formatUtcIsoShort('2025-01-02T03:04:05Z')).toBe('2025-01-02 03:04:05 UTC');
    expect(formatUtcIsoShort(null)).toBe('—');
  });
});