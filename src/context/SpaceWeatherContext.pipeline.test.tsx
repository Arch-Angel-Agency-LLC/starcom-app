/*
 * Pipeline integration tests for SpaceWeatherContext
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SpaceWeatherProvider, useSpaceWeatherContext } from './SpaceWeatherContext';
import { useEcoNaturalSettings } from '../hooks/useEcoNaturalSettings';
import { useSpaceWeatherData } from '../hooks/useSpaceWeatherData';
import { useEnterpriseSpaceWeatherData } from '../hooks/useEnterpriseSpaceWeatherData';

// Mock visualization mode to always be active
vi.mock('./VisualizationModeContext', () => ({
  useVisualizationMode: () => ({
    visualizationMode: { mode: 'EcoNatural', subMode: 'SpaceWeather' },
    setVisualizationMode: vi.fn(),
    setPrimaryMode: vi.fn(),
    resetVisualizationMode: vi.fn()
  })
}));

// Mocks
vi.mock('../hooks/useEcoNaturalSettings');
vi.mock('../hooks/useSpaceWeatherData');
vi.mock('../hooks/useEnterpriseSpaceWeatherData');
vi.mock('../utils/electricFieldNormalization', () => ({
  normalizeElectricFieldVectors: (vectors) => (vectors || []).map((v) => ({
    ...v,
    normalizedMagnitude: v.magnitude || 0,
    originalMagnitude: v.magnitude || 0,
    isOutlier: false,
    percentileRank: 50
  }))
}));

// Orchestrator + adapters mocked to control outputs (mutable implementation for success/failure tests)
let fetchAllImpl = async () => ({
  datasets: [],
  vectors: [{ latitude: 10, longitude: 20, magnitude: 123, direction: 45, quality: 4 }],
  metrics: { adapterCount: 2, totalVectors: 1, fetchMs: 5, failures: 0 },
  errors: []
});
const orchestratorMock = {
  register() { return this; },
  async fetchAll() { return fetchAllImpl(); },
  clear: vi.fn()
};
vi.mock('../services/space-weather/AdapterOrchestrator', () => ({
  createAdapterOrchestrator: () => orchestratorMock
}));
vi.mock('../services/space-weather/adapters/NoaaInterMagAdapter', () => ({ createNoaaInterMagAdapter: () => ({ id: 'a' }) }));
vi.mock('../services/space-weather/adapters/NoaaUSCanadaAdapter', () => ({ createNoaaUSCanadaAdapter: () => ({ id: 'b' }) }));

const baseSettings = {
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
    autoRefresh: false,
    refreshInterval: 5,
    showStatistics: true,
    normalization: { method: 'linear', outlierFactor: 1.5, smoothingFactor: 0, percentileRange: [10,90], clampMax: null },
    enhancedSampling: false,
    pipelineEnabled: true,
    enabledDatasets: {
      intermag: true,
      usCanada: true,
      pipeline: true
    },
    samplingMode: 'legacy-topN',
    gridBinSize: 5,
    legacyCap: 500,
    magnitudeFloor: 0
  }
};

beforeEach(() => {
  vi.clearAllMocks();
  orchestratorMock.clear.mockReset();
  vi.mocked(useEcoNaturalSettings).mockReturnValue({
    config: baseSettings,
    updateSpaceWeather: vi.fn(),
    isElectricFieldsEnabled: true,
    vectorSettings: { intensity: 0.8, opacity: 0.6 },
    dataSettings: { autoRefresh: false, refreshIntervalMs: 300000 }
  });
  vi.mocked(useSpaceWeatherData).mockReturnValue({
    interMagData: null,
    usCanadaData: null,
    alerts: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    refresh: vi.fn()
  });
  vi.mocked(useEnterpriseSpaceWeatherData).mockReturnValue({
    interMagData: null,
    usCanadaData: null,
    alerts: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    refresh: vi.fn()
  });
});

const wrapper = (props) => React.createElement(SpaceWeatherProvider, null, props.children);

describe('SpaceWeatherContext pipeline integration', () => {
  it('activates pipeline and exposes pipeline telemetry', async () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.pipelineActive).toBe(true));
    expect(result.current.telemetry.pipeline?.totalVectors).toBe(1);
    expect(result.current.visualizationVectors.length).toBeGreaterThan(0);
  });
  
  it('handles pipeline failure and records error telemetry', async () => {
    fetchAllImpl = async () => { throw new Error('simulated failure'); };
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    await waitFor(() => expect(result.current.telemetry.pipeline?.failures).toBeGreaterThanOrEqual(1));
    expect(result.current.telemetry.pipelineActive).toBe(true);
    expect(result.current.telemetry.pipeline?.lastError).toContain('simulated failure');
  });
});
