// SpaceWeatherLayerRegistry.ts
// Central registry for tertiary space weather visualization layers
// Each layer defines id, label, emoji icon, tooltip, and associated settings component name

export type SpaceWeatherLayerCapability = 'overlay' | 'hud' | 'planned';

export interface SpaceWeatherLayerDefinition {
  id: string;
  label: string;
  emoji: string; // single-character (emoji) used for square button
  tooltip: string;
  settingsComponent?: string; // dynamic import key (component file exports default React.FC)
  experimental?: boolean;
  capability: SpaceWeatherLayerCapability;
  statusHint?: string;
}

// Canonical ordered list of all potential layers (even if unimplemented) so UI stays stable
export const SPACE_WEATHER_LAYERS: SpaceWeatherLayerDefinition[] = [
  {
    id: 'electricFields',
    label: 'Electric Fields',
    emoji: '⚡',
    tooltip: 'Electric field vectors (InterMag & US/Canada)',
    settingsComponent: 'SpaceWeatherSettingsElectricFields',
    capability: 'overlay',
    statusHint: 'Overlay + HUD controls live'
  },
  {
    id: 'geomagneticIndex',
    label: 'Geomagnetic Index',
    emoji: '🧭',
    tooltip: 'Geomagnetic indices (Kp / Dst)',
    settingsComponent: 'SpaceWeatherSettingsGeomagnetic',
    experimental: true,
    capability: 'hud',
    statusHint: 'HUD + control surface only (overlay pending)'
  },
  {
    id: 'solarWind',
    label: 'Solar Wind',
    emoji: '💨',
    tooltip: 'Solar wind plasma & magnetic parameters',
    settingsComponent: 'SpaceWeatherSettingsSolarWind',
    experimental: true,
    capability: 'hud',
    statusHint: 'Solar wind HUD panels only while overlay pipelines land'
  },
  {
    id: 'magnetosphere',
    label: 'Magnetosphere',
    emoji: '🛡️',
    tooltip: 'Magnetospheric currents & boundaries',
    experimental: true,
    capability: 'hud',
    statusHint: 'HUD metrics available; overlay wiring scheduled'
  },
  {
    id: 'ionosphere',
    label: 'Ionosphere',
    emoji: '🌐',
    tooltip: 'Ionospheric density & TEC layers',
    experimental: true,
    capability: 'planned',
    statusHint: 'Planned layer; awaiting TEC ingestion'
  },
  {
    id: 'radiation',
    label: 'Radiation Belts',
    emoji: '☢️',
    tooltip: 'Radiation belt particle flux',
    experimental: true,
    capability: 'hud',
    statusHint: 'HUD toggles wired; visual overlay queued'
  },
  {
    id: 'aurora',
    label: 'Aurora',
    emoji: '🌌',
    tooltip: 'Auroral oval & emissions',
    experimental: true,
    capability: 'hud',
    statusHint: 'Auroral HUD + controls active; overlay next'
  },
  {
    id: 'solarActivity',
    label: 'Solar Activity',
    emoji: '🌞',
    tooltip: 'Solar flares & sunspot regions',
    experimental: true,
    capability: 'planned',
    statusHint: 'Planned: flare map + sunspot feeds'
  },
  {
    id: 'cosmicRays',
    label: 'Cosmic Rays',
    emoji: '🛰️',
    tooltip: 'Cosmic ray flux & anomalies',
    experimental: true,
    capability: 'planned',
    statusHint: 'Research-only for now; UI placeholder'
  }
];

export const getSpaceWeatherLayer = (id: string) => SPACE_WEATHER_LAYERS.find(l => l.id === id);
