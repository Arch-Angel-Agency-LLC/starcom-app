// src/context/SpaceWeatherContext.test.ts
// AI-NOTE: Integration tests for SpaceWeatherContext toggle functionality
// Validates that electric field visualization can be toggled on/off correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { SpaceWeatherProvider, useSpaceWeatherContext } from './SpaceWeatherContext';

// Mock the hooks and utilities
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

const mockConfig = {
  spaceWeather: {
    showElectricFields: true,
    showGemagneticIndex: false,
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
    alertThresholds: {
      moderate: 1000,
      high: 3000,
      extreme: 5000
    },
    autoRefresh: true,
    refreshInterval: 5,
    showStatistics: true,
    normalization: {
      method: 'adaptive' as const,
      outlierFactor: 1.5,
      smoothingFactor: 0.1,
      percentileRange: [10, 90] as [number, number],
      clampMax: null
    }
  }
};

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock useEcoNaturalSettings
  vi.mocked(require('../hooks/useEcoNaturalSettings').useEcoNaturalSettings).mockReturnValue({
    config: mockConfig,
    updateSpaceWeather: mockUpdateSpaceWeather,
    isElectricFieldsEnabled: mockConfig.spaceWeather.showElectricFields,
    vectorSettings: {
      intensity: mockConfig.spaceWeather.vectorIntensity / 100,
      opacity: mockConfig.spaceWeather.vectorOpacity / 100
    },
    alertThresholds: mockConfig.spaceWeather.alertThresholds,
    dataSettings: {
      autoRefresh: mockConfig.spaceWeather.autoRefresh,
      refreshIntervalMs: mockConfig.spaceWeather.refreshInterval * 60 * 1000
    }
  });

  // Mock useSpaceWeatherData
  vi.mocked(require('../hooks/useSpaceWeatherData').useSpaceWeatherData).mockReturnValue(mockSpaceWeatherData);

  // Mock normalization function
  vi.mocked(require('../utils/electricFieldNormalization').normalizeElectricFieldVectors).mockReturnValue([]);
});

describe('SpaceWeatherContext Electric Field Toggle', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SpaceWeatherProvider>{children}</SpaceWeatherProvider>
  );

  it('should show overlay when electric fields are enabled', () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    
    expect(result.current.shouldShowOverlay).toBe(true);
    expect(result.current.isElectricFieldsEnabled).toBe(true);
  });

  it('should hide overlay when electric fields are disabled', () => {
    // Mock with electric fields disabled
    const disabledConfig = {
      ...mockConfig,
      spaceWeather: {
        ...mockConfig.spaceWeather,
        showElectricFields: false
      }
    };

    vi.mocked(require('../hooks/useEcoNaturalSettings').useEcoNaturalSettings).mockReturnValue({
      config: disabledConfig,
      updateSpaceWeather: mockUpdateSpaceWeather,
      isElectricFieldsEnabled: false,
      vectorSettings: {
        intensity: disabledConfig.spaceWeather.vectorIntensity / 100,
        opacity: disabledConfig.spaceWeather.vectorOpacity / 100
      },
      alertThresholds: disabledConfig.spaceWeather.alertThresholds,
      dataSettings: {
        autoRefresh: disabledConfig.spaceWeather.autoRefresh,
        refreshIntervalMs: disabledConfig.spaceWeather.refreshInterval * 60 * 1000
      }
    });

    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    
    expect(result.current.shouldShowOverlay).toBe(false);
    expect(result.current.isElectricFieldsEnabled).toBe(false);
  });

  it('should provide normalization settings', () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    
    expect(result.current.settings.normalization).toEqual({
      method: 'adaptive',
      outlierFactor: 1.5,
      smoothingFactor: 0.1,
      percentileRange: [10, 90],
      clampMax: null
    });
  });

  it('should provide update function', () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    
    expect(result.current.updateSettings).toBe(mockUpdateSpaceWeather);
  });

  it('should provide empty visualization vectors when no data', () => {
    const { result } = renderHook(() => useSpaceWeatherContext(), { wrapper });
    
    expect(result.current.visualizationVectors).toEqual([]);
  });
});
