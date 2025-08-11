import React from 'react';
import { useSpaceWeatherContext } from '../../../context/SpaceWeatherContext';

export const MagnetopauseLayer: React.FC = () => {
  const { telemetry } = useSpaceWeatherContext();
  if (!telemetry.modes.magnetopause.active) return null;
  return <div data-layer="magnetopause" style={{display:'none'}} />; // placeholder
};
