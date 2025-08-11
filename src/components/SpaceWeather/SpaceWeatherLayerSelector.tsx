import React from 'react';
import { useEcoNaturalSettings } from '../../hooks/useEcoNaturalSettings';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import { SPACE_WEATHER_LAYERS } from './SpaceWeatherLayerRegistry';

// Vertical square emoji buttons hugging right edge of left sidebar
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  position: 'absolute',
  top: 8,
  right: 4,
  zIndex: 5
};

const buttonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6,
  cursor: 'pointer',
  color: '#e0f7ff',
  userSelect: 'none',
  transition: 'all 0.15s ease'
};

const activeStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg,#1e88e5,#42a5f5)',
  color: '#fff',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.4)'
};

export const SpaceWeatherLayerSelector: React.FC = () => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const { visualizationMode } = useVisualizationMode();
  const active = visualizationMode.mode === 'EcoNatural' && visualizationMode.subMode === 'SpaceWeather';
  if (!active) return null;

  const { activeLayer } = config.spaceWeather;

  return (
    <div style={containerStyle}>
      {SPACE_WEATHER_LAYERS.map(layer => {
        const isActive = layer.id === activeLayer;
        return (
          <div
            key={layer.id}
            role="button"
            title={`${layer.label}${layer.experimental ? ' (experimental)' : ''}`}
            aria-pressed={isActive}
            onClick={() => updateSpaceWeather({ activeLayer: layer.id })}
            style={{ ...buttonStyle, ...(isActive ? activeStyle : {}), opacity: layer.experimental && !isActive ? 0.6 : 1 }}
          >
            {layer.emoji}
          </div>
        );
      })}
    </div>
  );
};

export default SpaceWeatherLayerSelector;
