import React from 'react';
import { useSpaceWeatherContext } from '../../../context/SpaceWeatherContext';

export const MagneticFieldLayer: React.FC = () => {
  const { telemetry } = useSpaceWeatherContext();
  if (!telemetry.modes.magneticField.active) return null;
  return <div data-layer="magnetic-field" style={{display:'none'}} />; // placeholder
};
