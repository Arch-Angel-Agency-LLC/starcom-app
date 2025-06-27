// src/components/HUD/Settings/SpaceWeatherSettings/ElectricFieldToggleTest.tsx
// AI-NOTE: Simple test component to validate electric field toggle functionality
// This can be temporarily added to verify the integration works correctly

import React from 'react';
import { useEcoNaturalSettings } from '../../../../hooks/useEcoNaturalSettings';
import { useSpaceWeatherContext } from '../../../../context/SpaceWeatherContext';

const ElectricFieldToggleTest: React.FC = () => {
  const { config, isElectricFieldsEnabled } = useEcoNaturalSettings();
  const { visualizationVectors, shouldShowOverlay } = useSpaceWeatherContext();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <h4>Electric Field Toggle Test</h4>
      <div>Show Electric Fields: {config.spaceWeather.showElectricFields ? '✅' : '❌'}</div>
      <div>Is Enabled: {isElectricFieldsEnabled ? '✅' : '❌'}</div>
      <div>Should Show Overlay: {shouldShowOverlay ? '✅' : '❌'}</div>
      <div>Visualization Vectors: {visualizationVectors.length}</div>
      <div>Normalization Method: {config.spaceWeather.normalization.method}</div>
      <div>Outlier Factor: {config.spaceWeather.normalization.outlierFactor.toFixed(1)}</div>
      <div>Smoothing: {Math.round(config.spaceWeather.normalization.smoothingFactor * 100)}%</div>
    </div>
  );
};

export default ElectricFieldToggleTest;
