/* eslint-disable @typescript-eslint/no-require-imports */
// src/context/SpaceWeatherContext.test.ts
// Integration tests for SpaceWeatherContext basic toggle & layer gating

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SpaceWeatherProvider, useSpaceWeatherContext } from './SpaceWeatherContext';

// Mock visualization mode to satisfy mode gating (EcoNatural/SpaceWeather)
vi.mock('./VisualizationModeContext', () => ({
  useVisualizationMode: () => ({
    visualizationMode: { mode: 'EcoNatural', subMode: 'SpaceWeather' },
    setVisualizationMode: vi.fn(),
    setPrimaryMode: vi.fn(),
    resetVisualizationMode: vi.fn()
  })
}));

// Mock dependent hooks & utils
vi.mock('../hooks/useEcoNaturalSettings');
vi.mock('../hooks/useSpaceWeatherData');
vi.mock('../utils/electricFieldNormalization');
// Orchestrator + adapters (mocked lazily for pipeline tests)
vi.mock('../services/space-weather/AdapterOrchestrator', () => ({
  createAdapterOrchestrator: () => ({
    register() { return this; },
    async fetchAll() { return fetchAllImpl(); }
  })
}));
vi.mock('../services/space-weather/adapters/NoaaInterMagAdapter', () => ({ createNoaaInterMagAdapter: () => ({ id: 'a' }) }));
vi.mock('../services/space-weather/adapters/NoaaUSCanadaAdapter', () => ({ createNoaaUSCanadaAdapter: () => ({ id: 'b' }) }));

const mockUpdateSpaceWeather = vi.fn();
const mockSpaceWeatherData = {
  interMagData: null,
  usCanadaData: null,
  alerts: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  refresh: vi.fn()
};

const baseConfig = {
  spaceWeather: {
    activeLayer: 'electricFields',
    showElectricFields: true,
    showGeomagneticIndex: false,
    showAlerts: true,
    vectorIntensity: 80,
    vectorOpacity: 60,
    vectorScale: 1.0,
    heatMapIntensity: 50,
    showMagneticField: false,
    showAuroralOval: false,
    showKpIndex: false,
    showSolarWind: false,
    showMagnetopause: false,
    timeWindow: 24,
    alertThresholds: { moderate: 1000, high: 3000, extreme: 5000 },
    autoRefresh: true,
    refreshInterval: 5,
    showStatistics: true,
    normalization: {
      method: 'adaptive',
      outlierFactor: 1.5,
      smoothingFactor: 0.1,
      percentileRange: [10, 90],
      clampMax: null
    },
    enhancedSampling: false,
    pipelineEnabled: false
  }
};

// Mutable implementation for pipeline fetch (overridden in pipeline tests)
let fetchAllImpl = async () => ({
  datasets: [],
  vectors: [{ latitude: 10, longitude: 20, magnitude: 123, direction: 45, quality: 4 }],
  metrics: { adapterCount: 2, totalVectors: 1, fetchMs: 5, failures: 0 },
  errors: []
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(require('../hooks/useEcoNaturalSettings').useEcoNaturalSettings).mockReturnValue({
    config: baseConfig,
    updateSpaceWeather: mockUpdateSpaceWeather,
    isElectricFieldsEnabled: baseConfig.spaceWeather.showElectricFields,
    vectorSettings: { intensity: baseConfig.spaceWeather.vectorIntensity / 100, opacity: baseConfig.spaceWeather.vectorOpacity / 100 },
    alertThresholds: baseConfig.spaceWeather.alertThresholds,
    dataSettings: { autoRefresh: baseConfig.spaceWeather.autoRefresh, refreshIntervalMs: baseConfig.spaceWeather.refreshInterval * 60 * 1000 }
  });
  vi.mocked(require('../hooks/useSpaceWeatherData').useSpaceWeatherData).mockReturnValue(mockSpaceWeatherData);
  vi.mocked(require('../utils/electricFieldNormalization').normalizeElectricFieldVectors).mockReturnValue([]);
});

describe('SpaceWeatherContext pipeline integration', () => {
  const wrapper = (props) => React.createElement(SpaceWeatherProvider, null, props.children);

  it('activates pipeline and exposes telemetry when enabled', async () => {
    // Enable pipeline in settings mock
    const pipelineConfig = { ...baseConfig, spaceWeather: { ...baseConfig.spaceWeather, pipelineEnabled: true, autoRefresh: false } };
    vi.mocked(require('../hooks/useEcoNaturalSettings').useEcoNaturalSettings).mockReturnValue({
      config: pipelineConfig,
      updateSpaceWeather: mockUpdateSpaceWeather,
      isElectricFieldsEnabled: true,
      vectorSettings: { intensity: pipelineConfig.spaceWeather.vectorIntensity / 100, opacity: pipelineConfig.spaceWeather.vectorOpacity / 100 },
      alertThresholds: pipelineConfig.spaceWeather.alertThresholds,
      dataSettings: { autoRefresh: false, refreshIntervalMs: 300000 }
    });
    // Normalization pass-through so vectors remain
    vi.mocked(require('../utils/electricFieldNormalization').normalizeElectricFieldVectors).mockImplementation(v => v);
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.pipelineActive).toBe(true));
    expect(result.current.telemetry.pipeline?.totalVectors).toBe(1);
    expect(result.current.visualizationVectors.length).toBeGreaterThan(0);
  });

  it('records failure telemetry and disables pipeline when fetch throws', async () => {
    const pipelineConfig = { ...baseConfig, spaceWeather: { ...baseConfig.spaceWeather, pipelineEnabled: true, autoRefresh: false } };
    vi.mocked(require('../hooks/useEcoNaturalSettings').useEcoNaturalSettings).mockReturnValue({
      config: pipelineConfig,
      updateSpaceWeather: mockUpdateSpaceWeather,
      isElectricFieldsEnabled: true,
      vectorSettings: { intensity: pipelineConfig.spaceWeather.vectorIntensity / 100, opacity: pipelineConfig.spaceWeather.vectorOpacity / 100 },
      alertThresholds: pipelineConfig.spaceWeather.alertThresholds,
      dataSettings: { autoRefresh: false, refreshIntervalMs: 300000 }
    });
    // Cause orchestrator failure
    fetchAllImpl = async () => { throw new Error('simulated failure'); };
    vi.mocked(require('../utils/electricFieldNormalization').normalizeElectricFieldVectors).mockImplementation(v => v);
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.pipeline?.failures).toBeGreaterThanOrEqual(1));
    expect(result.current.telemetry.pipelineActive).toBe(false);
    expect(result.current.telemetry.pipeline?.lastError).toContain('simulated failure');
  });
});

describe('SpaceWeatherContext basic & layer gating', () => {
  const wrapper = (props) => React.createElement(SpaceWeatherProvider, null, props.children);

  it('shows overlay when activeLayer is electricFields and enabled', () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    expect(result.current.shouldShowOverlay).toBe(true);
  });

  it('hides overlay when electric fields disabled', () => {
    const disabledConfig = { ...baseConfig, spaceWeather: { ...baseConfig.spaceWeather, showElectricFields: false } };
    vi.mocked(require('../hooks/useEcoNaturalSettings').useEcoNaturalSettings).mockReturnValue({
      config: disabledConfig,
      updateSpaceWeather: mockUpdateSpaceWeather,
      isElectricFieldsEnabled: false,
      vectorSettings: { intensity: disabledConfig.spaceWeather.vectorIntensity / 100, opacity: disabledConfig.spaceWeather.vectorOpacity / 100 },
      alertThresholds: disabledConfig.spaceWeather.alertThresholds,
      dataSettings: { autoRefresh: disabledConfig.spaceWeather.autoRefresh, refreshIntervalMs: disabledConfig.spaceWeather.refreshInterval * 60 * 1000 }
    });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    expect(result.current.shouldShowOverlay).toBe(false);
  });

  it('gates overlay when activeLayer is geomagnetic (placeholder)', () => {
    const geomagneticConfig = { ...baseConfig, spaceWeather: { ...baseConfig.spaceWeather, activeLayer: 'geomagnetic' } };
    vi.mocked(require('../hooks/useEcoNaturalSettings').useEcoNaturalSettings).mockReturnValue({
      config: geomagneticConfig,
      updateSpaceWeather: mockUpdateSpaceWeather,
      isElectricFieldsEnabled: geomagneticConfig.spaceWeather.showElectricFields,
      vectorSettings: { intensity: geomagneticConfig.spaceWeather.vectorIntensity / 100, opacity: geomagneticConfig.spaceWeather.vectorOpacity / 100 },
      alertThresholds: geomagneticConfig.spaceWeather.alertThresholds,
      dataSettings: { autoRefresh: geomagneticConfig.spaceWeather.autoRefresh, refreshIntervalMs: geomagneticConfig.spaceWeather.refreshInterval * 60 * 1000 }
    });
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    expect(result.current.shouldShowOverlay).toBe(false);
    expect(result.current.visualizationVectors).toEqual([]);
  });

  it('exposes normalization settings', () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    expect(result.current.settings.normalization.method).toBe('adaptive');
  });

  it('provides update function', () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    expect(result.current.updateSettings).toBe(mockUpdateSpaceWeather);
  });

  it('supports activeLayer update persistence', () => {
    const { result, rerender } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    expect(result.current.settings.activeLayer).toBe('electricFields');
    mockUpdateSpaceWeather({ activeLayer: 'geomagnetic' });
    expect(mockUpdateSpaceWeather).toHaveBeenCalledWith({ activeLayer: 'geomagnetic' });
    const updatedConfig = { ...baseConfig, spaceWeather: { ...baseConfig.spaceWeather, activeLayer: 'geomagnetic' } };
    vi.mocked(require('../hooks/useEcoNaturalSettings').useEcoNaturalSettings).mockReturnValue({
      config: updatedConfig,
      updateSpaceWeather: mockUpdateSpaceWeather,
      isElectricFieldsEnabled: updatedConfig.spaceWeather.showElectricFields,
      vectorSettings: { intensity: updatedConfig.spaceWeather.vectorIntensity / 100, opacity: updatedConfig.spaceWeather.vectorOpacity / 100 },
      alertThresholds: updatedConfig.spaceWeather.alertThresholds,
      dataSettings: { autoRefresh: updatedConfig.spaceWeather.autoRefresh, refreshIntervalMs: updatedConfig.spaceWeather.refreshInterval * 60 * 1000 }
    });
    rerender();
    expect(result.current.settings.activeLayer).toBe('geomagnetic');
  });
});
