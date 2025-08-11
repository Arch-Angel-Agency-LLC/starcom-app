import React from 'react';
import { useSpaceWeatherContext } from '../../../context/SpaceWeatherContext';

export const AuroralOvalLayer: React.FC = () => {
  const { telemetry } = useSpaceWeatherContext();
  if (!telemetry.modes.auroralOval.active) return null;
  return <div data-layer="auroral-oval" style={{display:'none'}} />; // placeholder
};
