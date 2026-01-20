import type { SpaceWeatherPassiveBundle } from '../../components/SpaceWeather/SpaceWeatherSidebarLayout';

export interface SpaceWeatherExportPayload {
  telemetry: SpaceWeatherPassiveBundle['telemetry'];
  history: SpaceWeatherPassiveBundle['telemetryHistory'];
  providerStatus: SpaceWeatherPassiveBundle['providerStatus'];
  currentProvider: SpaceWeatherPassiveBundle['currentProvider'];
  alerts: SpaceWeatherPassiveBundle['alerts'];
  enhancedAlerts: SpaceWeatherPassiveBundle['enhancedAlerts'];
}

// Stub export function; replace with real transport (file download or API submit)
export async function exportSpaceWeatherSnapshot(payload: SpaceWeatherExportPayload): Promise<void> {
  // TODO: wire to export endpoint or client-side download
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('SpaceWeather export payload', payload);
  }
  return Promise.resolve();
}
