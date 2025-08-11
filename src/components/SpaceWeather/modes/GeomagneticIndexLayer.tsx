import React from 'react';
import { useSpaceWeatherContext } from '../../../context/SpaceWeatherContext';

export const GeomagneticIndexLayer: React.FC = () => {
  const { telemetry } = useSpaceWeatherContext();
  if (!telemetry.modes.geomagnetic.active) return null;
  return <div data-layer="geomagnetic-index" style={{display:'none'}} />; // placeholder
};
