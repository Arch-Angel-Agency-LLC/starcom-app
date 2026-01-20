import React, { Suspense } from 'react';
import { getSpaceWeatherLayer } from './SpaceWeatherLayerRegistry';

// Dynamically map layer.id -> settings component (lazy load implemented for future scaling)
// For now we'll synchronously import known components to keep simplicity
import SpaceWeatherSettingsElectricFields from './settings/SpaceWeatherSettingsElectricFields';
import SpaceWeatherSettingsGeomagnetic from './settings/SpaceWeatherSettingsGeomagnetic';
import SpaceWeatherSettingsSolarWind from './settings/SpaceWeatherSettingsSolarWind';
import SpaceWeatherSettingsAuroralOval from './settings/SpaceWeatherSettingsAuroralOval';
import SpaceWeatherSettingsMagnetopause from './settings/SpaceWeatherSettingsMagnetopause';
import SpaceWeatherSettingsMagneticField from './settings/SpaceWeatherSettingsMagneticField';

const registryComponentMap: Record<string, React.FC | undefined> = {
  electricFields: SpaceWeatherSettingsElectricFields,
  geomagneticIndex: SpaceWeatherSettingsGeomagnetic,
  solarWind: SpaceWeatherSettingsSolarWind,
  aurora: SpaceWeatherSettingsAuroralOval,
  magnetosphere: SpaceWeatherSettingsMagnetopause,
  radiation: SpaceWeatherSettingsMagneticField
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  position: 'relative'
};

interface SpaceWeatherSettingsContainerProps {
  layerId: string;
  layerLabel?: string;
}

export const SpaceWeatherSettingsContainer: React.FC<SpaceWeatherSettingsContainerProps> = ({ layerId, layerLabel }) => {
  if (!layerId) return null;

  const layer = getSpaceWeatherLayer(layerId);
  const Component = registryComponentMap[layerId];
  const displayLabel = layerLabel ?? layer?.label ?? 'Layer';

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.8 }}>
        {displayLabel} Settings
      </div>
      <Suspense fallback={<div style={{ fontSize: 11, opacity: 0.7 }}>Loading layer settings...</div>}>
        {Component ? <Component /> : <div style={{ fontSize: 11, opacity: 0.6 }}>No settings implemented yet.</div>}
      </Suspense>
    </div>
  );
};

export default SpaceWeatherSettingsContainer;
