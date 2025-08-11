// SpaceWeatherModeLayers.tsx
// Aggregates all tertiary mode placeholder layers so they mount once within the SpaceWeatherProvider.
// Each individual layer internally checks its own active flag via telemetry.modes.<mode>.active.
import React from 'react';
import { GeomagneticIndexLayer } from './modes/GeomagneticIndexLayer';
import { AuroralOvalLayer } from './modes/AuroralOvalLayer';
import { SolarWindLayer } from './modes/SolarWindLayer';
import { MagnetopauseLayer } from './modes/MagnetopauseLayer';
import { MagneticFieldLayer } from './modes/MagneticFieldLayer';

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  pointerEvents: 'none',
  top: 0,
  left: 0,
  width: 0,
  height: 0
};

export const SpaceWeatherModeLayers: React.FC = () => (
  <div data-space-weather-mode-layers style={containerStyle}>
    <GeomagneticIndexLayer />
    <AuroralOvalLayer />
    <SolarWindLayer />
    <MagnetopauseLayer />
    <MagneticFieldLayer />
  </div>
);

export default SpaceWeatherModeLayers;
