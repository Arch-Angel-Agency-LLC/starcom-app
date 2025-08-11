/* eslint-disable @typescript-eslint/no-require-imports */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { SpaceWeatherProvider, useSpaceWeatherContext } from './SpaceWeatherContext';

vi.mock('./VisualizationModeContext', () => ({
  useVisualizationMode: () => ({
    visualizationMode: { mode: 'EcoNatural', subMode: 'SpaceWeather' },
    setVisualizationMode: vi.fn(),
    setPrimaryMode: vi.fn(),
    resetVisualizationMode: vi.fn()
  })
}));

vi.mock('../hooks/useEcoNaturalSettings');
vi.mock('../hooks/useSpaceWeatherData');
vi.mock('../utils/electricFieldNormalization');

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
    normalization: { method: 'adaptive', outlierFactor: 1.5, smoothingFactor: 0.1, percentileRange: [10, 90], clampMax: null },
    enhancedSampling: false,
    pipelineEnabled: false
  }
};

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

describe('SpaceWeatherContext gating & telemetry', () => {
  const wrapper = (props) => React.createElement(SpaceWeatherProvider, null, props.children);

  it('shows overlay & null gatingReason for active electricFields layer', () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    expect(result.current.shouldShowOverlay).toBe(true);
    expect(result.current.telemetry.gatingReason).toBeNull();
  });

  it('reports inactiveLayer gatingReason when layer switched', () => {
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
    expect(result.current.telemetry.gatingReason).toBe('inactiveLayer');
  });
});
