import React from 'react';
import { useEcoNaturalSettings } from '../../../hooks/useEcoNaturalSettings';

// Placeholder settings UI for Auroral Oval mode
const section: React.CSSProperties = { fontSize: 10, letterSpacing: 0.5, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', marginTop: 2 };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 };

const SpaceWeatherSettingsAuroralOval: React.FC = () => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const sw = config.spaceWeather;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={section}>Basic</div>
      <div style={row} title="Toggle auroral oval visualization (stub)">
        <label>Auroral Oval</label>
        <input type="checkbox" checked={sw.showAuroralOval} onChange={e => updateSpaceWeather({ showAuroralOval: e.target.checked })} />
      </div>
      <div style={section}>Advanced</div>
      <div style={{ fontSize: 11, opacity: 0.65 }}>Real-time auroral intensity & resolution controls will appear here.</div>
    </div>
  );
};
export default SpaceWeatherSettingsAuroralOval;
