import React from 'react';
import { useEcoNaturalSettings } from '../../../hooks/useEcoNaturalSettings';

// Placeholder settings UI for Magnetic Field mode
const section: React.CSSProperties = { fontSize: 10, letterSpacing: 0.5, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', marginTop: 2 };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 };

const SpaceWeatherSettingsMagneticField: React.FC = () => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const sw = config.spaceWeather;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={section}>Basic</div>
      <div style={row} title="Toggle magnetic field sample visualization (stub)">
        <label>Magnetic Field</label>
        <input type="checkbox" checked={sw.showMagneticField} onChange={e => updateSpaceWeather({ showMagneticField: e.target.checked })} />
      </div>
      <div style={section}>Advanced</div>
      <div style={{ fontSize: 11, opacity: 0.65 }}>Planned: field line tracing density & seed controls.</div>
    </div>
  );
};
export default SpaceWeatherSettingsMagneticField;
