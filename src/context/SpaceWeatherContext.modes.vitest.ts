/* SpaceWeatherContext.modes.vitest.ts
   Minimal Vitest tests for tertiary mode telemetry activation & stub values.
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SpaceWeatherProvider, useSpaceWeatherContext } from './SpaceWeatherContext';

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

let overridesRef: Record<string, unknown> = {};
vi.mock('../hooks/useEcoNaturalSettings', () => ({
  useEcoNaturalSettings: () => ({
    config: { ...baseConfig, spaceWeather: { ...baseConfig.spaceWeather, ...overridesRef } },
    updateSpaceWeather: vi.fn(),
    isElectricFieldsEnabled: true,
    vectorSettings: { intensity: 0.8, opacity: 0.6 },
    dataSettings: { autoRefresh: false, refreshIntervalMs: 300000 }
  })
}));

const setOverrides = (o: Record<string, unknown>) => { overridesRef = o; };

describe('SpaceWeatherContext tertiary modes telemetry (stubs)', () => {
  beforeEach(() => { overridesRef = {}; });
  const wrapper = (p) => React.createElement(SpaceWeatherProvider, null, p.children);

  it('geomagnetic mode activation', async () => {
  setOverrides({ showGeomagneticIndex: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.geomagnetic.active).toBe(true));
    expect(result.current.telemetry.modes.geomagnetic.kp).toBe(3);
  });

  it('auroral oval mode activation', async () => {
  setOverrides({ showAuroralOval: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.auroralOval.active).toBe(true));
    expect(result.current.telemetry.modes.auroralOval.resolution).toBe('low');
  });

  it('solar wind mode activation', async () => {
  setOverrides({ showSolarWind: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.solarWind.active).toBe(true));
    const sw = result.current.telemetry.modes.solarWind;
    expect(sw.speed).toBe(420);
    expect(sw.density).toBe(6);
    expect(sw.bz).toBe(-2);
  });

  it('magnetopause mode activation', async () => {
  setOverrides({ showMagnetopause: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.magnetopause.active).toBe(true));
    expect(result.current.telemetry.modes.magnetopause.standoffRe).toBe(10.5);
  });

  it('magnetic field mode activation', async () => {
  setOverrides({ showMagneticField: true });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.modes.magneticField.active).toBe(true));
    expect(result.current.telemetry.modes.magneticField.sampleCount).toBe(250);
  });
});
