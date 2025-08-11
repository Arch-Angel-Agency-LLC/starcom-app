// SpaceWeatherContext.modes.test.ts
// Minimal tests validating tertiary mode telemetry activation & stub data population.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SpaceWeatherProvider, useSpaceWeatherContext } from './SpaceWeatherContext';

// Force EcoNatural/SpaceWeather visualization mode
vi.mock('./VisualizationModeContext', () => ({
  useVisualizationMode: () => ({
    visualizationMode: { mode: 'EcoNatural', subMode: 'SpaceWeather' },
    setVisualizationMode: vi.fn(),
    setPrimaryMode: vi.fn(),
    resetVisualizationMode: vi.fn()
  })
}));

vi.mock('../hooks/useSpaceWeatherData', () => ({ useSpaceWeatherData: () => ({ interMagData: null, usCanadaData: null, alerts: [], isLoading: false, error: null, lastUpdated: null, refresh: vi.fn() }) }));
vi.mock('../hooks/useEnterpriseSpaceWeatherData', () => ({ useEnterpriseSpaceWeatherData: () => ({ interMagData: null, usCanadaData: null, alerts: [], isLoading: false, error: null, lastUpdated: null, refresh: vi.fn() }) }));
vi.mock('../utils/electricFieldNormalization', () => ({ normalizeElectricFieldVectors: () => [] }));

// Base template config; individual tests override one flag at a time to limit interactions
const baseConfig = {
  spaceWeather: {
    activeLayer: 'electricFields',
    showElectricFields: true,
    showGeomagneticIndex: false,
    showAuroralOval: false,
    showSolarWind: false,
    showMagnetopause: false,
    showMagneticField: false,
    showKpIndex: false,
    showAlerts: false,
    vectorIntensity: 80,
    vectorOpacity: 60,
    vectorScale: 1,
    heatMapIntensity: 50,
    timeWindow: 24,
    alertThresholds: { moderate: 1000, high: 3000, extreme: 5000 },
    autoRefresh: false,
    refreshInterval: 5,
    showStatistics: false,
    normalization: { method: 'adaptive', outlierFactor: 1.5, smoothingFactor: 0.1, percentileRange: [10,90], clampMax: null },
    enhancedSampling: false,
    pipelineEnabled: false
  }
};

// Helper to mock settings per test
// NOTE: Using broad any typing in tests to avoid TS transform issues in Vitest/Jest parser
// (The original Partial<typeof baseConfig.spaceWeather> triggered a Babel parse edge case)
const mockSettings = (overrides) => {
  vi.mock('../hooks/useEcoNaturalSettings', () => ({
    useEcoNaturalSettings: () => ({
      config: { ...baseConfig, spaceWeather: { ...baseConfig.spaceWeather, ...overrides } },
      updateSpaceWeather: vi.fn(),
      isElectricFieldsEnabled: true,
      vectorSettings: { intensity: 0.8, opacity: 0.6 },
      dataSettings: { autoRefresh: false, refreshIntervalMs: 300000 }
    })
  }));
};

describe('SpaceWeatherContext tertiary modes telemetry', () => {
  beforeEach(() => { vi.resetModules(); });
  const wrapper = (p) => React.createElement(SpaceWeatherProvider, null, p.children);

  it('activates geomagnetic mode and populates kp', async () => {
    mockSettings({ showGeomagneticIndex: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.geomagnetic.active).toBe(true));
    expect(result.current.telemetry.modes.geomagnetic.kp).toBe(3);
    expect(result.current.telemetry.modes.geomagnetic.lastUpdate).not.toBeNull();
  });

  it('activates auroral oval mode and populates resolution', async () => {
    mockSettings({ showAuroralOval: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.auroralOval.active).toBe(true));
    expect(result.current.telemetry.modes.auroralOval.resolution).toBe('low');
  });

  it('activates solar wind mode and populates plasma params', async () => {
    mockSettings({ showSolarWind: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.solarWind.active).toBe(true));
    const sw = result.current.telemetry.modes.solarWind;
    expect(sw.speed).toBe(420);
    expect(sw.density).toBe(6);
    expect(sw.bz).toBe(-2);
  });

  it('activates magnetopause mode and populates standoff', async () => {
    mockSettings({ showMagnetopause: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.magnetopause.active).toBe(true));
    expect(result.current.telemetry.modes.magnetopause.standoffRe).toBe(10.5);
  });

  it('activates magnetic field mode and populates sample count', async () => {
    mockSettings({ showMagneticField: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.magneticField.active).toBe(true));
    expect(result.current.telemetry.modes.magneticField.sampleCount).toBe(250);
  });
});
