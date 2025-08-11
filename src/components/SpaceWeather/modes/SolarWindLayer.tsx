import React from 'react';
import { useSpaceWeatherContext } from '../../../context/SpaceWeatherContext';

export const SolarWindLayer: React.FC = () => {
  const { telemetry } = useSpaceWeatherContext();
  if (!telemetry.modes.solarWind.active) return null;
  return <div data-layer="solar-wind" style={{display:'none'}} />; // placeholder
};
