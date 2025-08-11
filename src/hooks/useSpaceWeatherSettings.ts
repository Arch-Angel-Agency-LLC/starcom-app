// DEPRECATED (Aug 2025): useSpaceWeatherSettings has been superseded by useEcoNaturalSettings
// This file now provides a thin proxy to maintain backward compatibility for any lingering imports.
// It maps a subset of legacy properties to the new eco-natural config shape.

import { useEcoNaturalSettings } from './useEcoNaturalSettings';

export interface SpaceWeatherSettingsProxy {
  config: ReturnType<typeof useEcoNaturalSettings>['config']['spaceWeather'];
  updateConfig: ReturnType<typeof useEcoNaturalSettings>['updateSpaceWeather'];
  resetConfig: () => void;
  isElectricFieldsEnabled: boolean;
  isAlertsEnabled: boolean;
  vectorSettings: { intensity: number; opacity: number };
  alertThresholds: { moderate: number; high: number; extreme: number };
  dataSettings: { autoRefresh: boolean; refreshIntervalMs: number };
}

/**
 * @deprecated Use useEcoNaturalSettings() and its updateSpaceWeather/resetSubMode instead.
 * Thin proxy maintained temporarily for backward compatibility. Will be removed in a future release.
 */
export const useSpaceWeatherSettings = (): SpaceWeatherSettingsProxy => {
  const { config, updateSpaceWeather, resetSubMode } = useEcoNaturalSettings();
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __SW_SETTINGS_PROXY_WARNED__?: boolean };
    if (!w.__SW_SETTINGS_PROXY_WARNED__) {
      console.warn('[DEPRECATED] useSpaceWeatherSettings is deprecated. Migrate to useEcoNaturalSettings.');
      w.__SW_SETTINGS_PROXY_WARNED__ = true;
    }
  }
  const sw = config.spaceWeather;
  return {
    config: sw,
    updateConfig: updateSpaceWeather,
    resetConfig: () => resetSubMode('spaceWeather'),
    isElectricFieldsEnabled: sw.showElectricFields,
    isAlertsEnabled: sw.showAlerts,
    vectorSettings: {
      intensity: sw.vectorIntensity / 100,
      opacity: sw.vectorOpacity / 100
    },
    alertThresholds: sw.alertThresholds,
    dataSettings: {
      autoRefresh: sw.autoRefresh,
      refreshIntervalMs: sw.refreshInterval * 60 * 1000
    }
  };
};

export default useSpaceWeatherSettings;
