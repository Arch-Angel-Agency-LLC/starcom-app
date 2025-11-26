import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import SpaceWeatherProvider, { useSpaceWeatherContext } from '../SpaceWeatherContext';
import type { SpaceWeatherDiagnosticsState } from '../../services/space-weather/SpaceWeatherDiagnostics';
import { makeDiagnosticsState, makeDegradedDiagnosticsState } from '../../testing/spaceWeatherDiagnostics.fixtures';

const diagnosticsHarness = vi.hoisted(() => ({
  state: null as SpaceWeatherDiagnosticsState | null,
  listeners: new Set<(state: SpaceWeatherDiagnosticsState) => void>()
})) as { state: SpaceWeatherDiagnosticsState | null; listeners: Set<(state: SpaceWeatherDiagnosticsState) => void> };

vi.mock('../../services/space-weather/SpaceWeatherDiagnostics', () => {
  return {
    spaceWeatherDiagnostics: {
      getState: () => {
        if (!diagnosticsHarness.state) {
          throw new Error('diagnosticsHarness state not primed before use');
        }
        return diagnosticsHarness.state;
      },
      subscribe: (listener: (state: SpaceWeatherDiagnosticsState) => void) => {
        diagnosticsHarness.listeners.add(listener);
        if (diagnosticsHarness.state) {
          listener(diagnosticsHarness.state);
        }
        return () => diagnosticsHarness.listeners.delete(listener);
      }
    }
  };
});

vi.mock('../../hooks/useEcoNaturalSettings', () => {
  const config = {
    spaceWeather: {
      showGeomagneticIndex: false,
      showAuroralOval: false,
      showSolarWind: false,
      showMagnetopause: false,
      showMagneticField: false,
      showElectricFields: true,
      showAlerts: false,
      vectorIntensity: 100,
      vectorScale: 1,
      vectorOpacity: 100,
      pipelineEnabled: false,
      enhancedSampling: false,
      activeLayer: 'electricFields',
      normalization: {
        method: 'percentile',
        outlierFactor: 2,
        smoothingFactor: 0,
        percentileRange: [5, 95] as [number, number],
        clampMax: 1
      }
    }
  };

  return {
    useEcoNaturalSettings: () => ({
      config,
      updateSpaceWeather: vi.fn(),
      isElectricFieldsEnabled: true,
      vectorSettings: { intensity: 1, opacity: 1 },
      dataSettings: { autoRefresh: false, refreshIntervalMs: 60000 }
    })
  };
});

const mockSpaceWeatherData = {
  interMagData: null,
  usCanadaData: null,
  alerts: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  refresh: vi.fn().mockResolvedValue(undefined)
};

vi.mock('../../hooks/useSpaceWeatherData', () => ({
  useSpaceWeatherData: () => mockSpaceWeatherData
}));

vi.mock('../../hooks/useEnterpriseSpaceWeatherData', () => ({
  useEnterpriseSpaceWeatherData: () => mockSpaceWeatherData
}));

vi.mock('../VisualizationModeContext', () => ({
  useVisualizationMode: () => ({
    visualizationMode: { mode: 'EcoNatural', subMode: 'SpaceWeather' }
  })
}));

const stubModeData = { data: null, lastUpdated: null };

vi.mock('../../hooks/useGeomagneticData', () => ({
  useGeomagneticData: () => stubModeData
}));

vi.mock('../../hooks/useAuroralOvalData', () => ({
  useAuroralOvalData: () => stubModeData
}));

vi.mock('../../hooks/useSolarWindData', () => ({
  useSolarWindData: () => stubModeData
}));

vi.mock('../../hooks/useMagnetopauseData', () => ({
  useMagnetopauseData: () => stubModeData
}));

vi.mock('../../hooks/useMagneticFieldData', () => ({
  useMagneticFieldData: () => stubModeData
}));

vi.mock('../../services/data-management/DataTransformService', () => {
  class MockDataTransformService {
    static getInstance() {
      return {};
    }
  }
  return { DataTransformService: MockDataTransformService };
});

vi.mock('../../services/data-management/DataQualityService', () => {
  class MockDataQualityService {
    static getInstance() {
      return {
        assessDataQuality: vi.fn(),
        validateForAlerts: vi.fn().mockResolvedValue([])
      };
    }
  }
  return { DataQualityService: MockDataQualityService };
});

const diagnosticsWrapper = ({ children }: { children: React.ReactNode }) => (
  <SpaceWeatherProvider>{children}</SpaceWeatherProvider>
);

function primeDiagnostics(state: SpaceWeatherDiagnosticsState) {
  diagnosticsHarness.state = state;
}

function emitDiagnostics(state: SpaceWeatherDiagnosticsState) {
  diagnosticsHarness.state = state;
  diagnosticsHarness.listeners.forEach(listener => listener(state));
}

describe('SpaceWeatherContext diagnostics integration', () => {
  beforeEach(() => {
    diagnosticsHarness.listeners.clear();
    primeDiagnostics(makeDiagnosticsState());
  });

  it('exposes diagnostics snapshots via context and telemetry', async () => {
    const initialState = makeDiagnosticsState();
    primeDiagnostics(initialState);

    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper: diagnosticsWrapper });

    expect(result.current.diagnostics).toEqual(initialState);
    expect(result.current.telemetry.diagnostics).toEqual(initialState);

    const degraded = makeDegradedDiagnosticsState();
    await act(async () => {
      emitDiagnostics(degraded);
    });

    await waitFor(() => {
      expect(result.current.diagnostics).toEqual(degraded);
      expect(result.current.telemetry.diagnostics).toEqual(degraded);
    });
  });
});
