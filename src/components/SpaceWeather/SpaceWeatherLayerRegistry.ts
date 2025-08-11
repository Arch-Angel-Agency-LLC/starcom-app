// SpaceWeatherLayerRegistry.ts
// Central registry for tertiary space weather visualization layers
// Each layer defines id, label, emoji icon, tooltip, and associated settings component name

export interface SpaceWeatherLayerDefinition {
  id: string;
  label: string;
  emoji: string; // single-character (emoji) used for square button
  tooltip: string;
  settingsComponent?: string; // dynamic import key (component file exports default React.FC)
  experimental?: boolean;
}

// Canonical ordered list of all potential layers (even if unimplemented) so UI stays stable
export const SPACE_WEATHER_LAYERS: SpaceWeatherLayerDefinition[] = [
  { id: 'electricFields', label: 'Electric Fields', emoji: '⚡', tooltip: 'Electric field vectors (InterMag & US/Canada)', settingsComponent: 'SpaceWeatherSettingsElectricFields' },
  { id: 'geomagneticIndex', label: 'Geomagnetic Index', emoji: '🧭', tooltip: 'Geomagnetic indices (Kp / Dst)', settingsComponent: 'SpaceWeatherSettingsGeomagnetic', experimental: true },
  { id: 'solarWind', label: 'Solar Wind', emoji: '💨', tooltip: 'Solar wind plasma & magnetic parameters', settingsComponent: 'SpaceWeatherSettingsSolarWind', experimental: true },
  { id: 'magnetosphere', label: 'Magnetosphere', emoji: '🛡️', tooltip: 'Magnetospheric currents & boundaries', experimental: true },
  { id: 'ionosphere', label: 'Ionosphere', emoji: '🌐', tooltip: 'Ionospheric density & TEC layers', experimental: true },
  { id: 'radiation', label: 'Radiation Belts', emoji: '☢️', tooltip: 'Radiation belt particle flux', experimental: true },
  { id: 'aurora', label: 'Aurora', emoji: '🌌', tooltip: 'Auroral oval & emissions', experimental: true },
  { id: 'solarActivity', label: 'Solar Activity', emoji: '🌞', tooltip: 'Solar flares & sunspot regions', experimental: true },
  { id: 'cosmicRays', label: 'Cosmic Rays', emoji: '🛰️', tooltip: 'Cosmic ray flux & anomalies', experimental: true },
];

export const getSpaceWeatherLayer = (id: string) => SPACE_WEATHER_LAYERS.find(l => l.id === id);
