import React from 'react';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import { useSpaceWeatherContext } from '../../context/SpaceWeatherContext';
import { SPACE_WEATHER_LAYERS, type SpaceWeatherLayerDefinition } from './SpaceWeatherLayerRegistry';
import styles from './SpaceWeatherLayerSelector.module.css';

interface SpaceWeatherLayerSelectorProps {
  className?: string;
}

export const SpaceWeatherLayerSelector: React.FC<SpaceWeatherLayerSelectorProps> = ({ className }) => {
  const { visualizationMode } = useVisualizationMode();
  const context = useSpaceWeatherContext();
  const active = visualizationMode.mode === 'EcoNatural' && visualizationMode.subMode === 'SpaceWeather';
  if (!active || !context) return null;

  const { settings, updateSettings } = context;
  const activeLayer = settings.activeLayer;

  const handleSelect = (layer: SpaceWeatherLayerDefinition) => {
    if (layer.capability === 'planned') {
      return;
    }
    if (layer.id === activeLayer) {
      return;
    }
    updateSettings({ activeLayer: layer.id });
  };

  return (
    <div className={[styles.layerSelector, className].filter(Boolean).join(' ')}>
      {SPACE_WEATHER_LAYERS.map(layer => {
        const isActive = layer.id === activeLayer;
        const isPlanned = layer.capability === 'planned';
        const buttonTitleParts = [
          layer.label,
          layer.experimental ? 'experimental' : null,
          layer.statusHint ?? null
        ].filter(Boolean);
        const buttonTitle = buttonTitleParts.join(' · ');
        const classNames = [
          styles.railButton,
          isActive ? styles.railButtonActive : '',
          layer.experimental ? styles.railButtonExperimental : '',
          isPlanned ? styles.railButtonDisabled : '',
          layer.capability === 'hud' ? styles.railButtonHudOnly : ''
        ].filter(Boolean).join(' ');
        return (
          <button
            key={layer.id}
            type="button"
            className={classNames}
            title={buttonTitle}
            aria-pressed={isActive}
            aria-disabled={isPlanned}
            data-capability={layer.capability}
            onClick={() => handleSelect(layer)}
          >
            {layer.emoji}
          </button>
        );
      })}
    </div>
  );
};

export default SpaceWeatherLayerSelector;
