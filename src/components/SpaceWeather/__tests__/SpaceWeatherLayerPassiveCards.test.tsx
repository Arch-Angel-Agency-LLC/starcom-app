import React from 'react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpaceWeatherLayerPassiveCard } from '../SpaceWeatherLayerPassiveCards';

const basePassive = {
  telemetry: {
    modes: {
      geomagnetic: { active: true, kp: 3, lastUpdate: Date.now(), quality: 'live' },
      auroralOval: { active: true, resolution: 'low', lastUpdate: Date.now(), quality: 'live' },
      solarWind: { active: true, speed: 420, density: 6, bz: -2, lastUpdate: Date.now(), quality: 'live' },
      magnetopause: { active: true, standoffRe: 10.5, lastUpdate: Date.now(), quality: 'live' },
      magneticField: { active: false, sampleCount: null, lastUpdate: null, quality: 'live' }
    },
    rawInterMag: 0,
    rawUSCanada: 0,
    rawPipeline: 0,
    combinedRaw: 0,
    sampled: 0,
    rendered: 0,
    samplingStrategy: 'legacy-topN',
    unit: 'mV/km',
    gatingReason: null,
    timings: { samplingMs: 0, normalizationMs: 0, totalMs: 0 },
    degraded: false,
    degradationStages: [],
    pipeline: null,
    pipelineActive: false,
    diagnostics: {}
  },
  telemetryHistory: [],
  lastLayerTimestamp: Date.now(),
  lastContextUpdate: Date.now(),
  gatingReason: null,
  alerts: [],
  enhancedAlerts: [],
  settingsSummary: { samplingMode: 'legacy-topN' },
  providerStatus: [],
  currentProvider: 'legacy'
};

const renderCard = (layerId, passive) => {
  const mergedTelemetry = { ...basePassive.telemetry, ...(passive && passive.telemetry ? passive.telemetry : {}) };
  const merged = { ...basePassive, ...passive, telemetry: mergedTelemetry };
  return render(<SpaceWeatherLayerPassiveCard layerId={layerId} passive={merged} />);
};

describe('SpaceWeatherLayerPassiveCards', () => {
  it('shows quality badge when quality is fallback', () => {
    renderCard('solarWind', {
      telemetry: {
        modes: {
          ...basePassive.telemetry.modes,
          solarWind: { active: true, speed: 420, density: 6, bz: -3, lastUpdate: Date.now(), quality: 'fallback' }
        }
      }
    });
    expect(screen.getByText(/Fallback/i)).toBeInTheDocument();
  });

  it('falls back to stale when lastUpdate is old and quality missing', () => {
    const old = Date.now() - 11 * 60 * 1000;
    renderCard('magnetosphere', {
      telemetry: {
        modes: {
          ...basePassive.telemetry.modes,
          magnetopause: { active: true, standoffRe: 9.5, lastUpdate: old }
        }
      }
    });
    expect(screen.getByText(/Stale/i)).toBeInTheDocument();
  });

  it('renders shimmer when gating is noData and no lastUpdate', () => {
    renderCard('aurora', {
      gatingReason: 'noData',
      telemetry: {
        modes: {
          ...basePassive.telemetry.modes,
          auroralOval: { active: true, resolution: 'low', lastUpdate: null }
        }
      }
    });
    const shimmers = screen.queryAllByTestId('shimmer-row');
    expect(shimmers.length).toBeGreaterThan(0);
  });
});
