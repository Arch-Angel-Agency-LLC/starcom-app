import React from 'react';
import { useEcoNaturalSettings } from '../../../hooks/useEcoNaturalSettings';

const section: React.CSSProperties = { fontSize: 10, letterSpacing: 0.5, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', marginTop: 2 };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 };
// (input style reserved for future numeric controls)

const SpaceWeatherSettingsSolarWind: React.FC = () => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const sw = config.spaceWeather;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={section}>Basic</div>
      <div style={{ fontSize: 11, opacity: 0.7 }}>Solar wind visualization not yet implemented.</div>
      <div style={section}>Medium</div>
      <div style={row} title="Placeholder toggle for solar wind data (future)">
        <label>Show Solar Wind</label>
        <input type="checkbox" checked={sw.showSolarWind} onChange={e => updateSpaceWeather({ showSolarWind: e.target.checked })} />
      </div>
      <div style={section}>Advanced</div>
      <div style={{ fontSize: 11, opacity: 0.65 }}>Advanced solar wind analytics will appear here.</div>
    </div>
  );
};
export default SpaceWeatherSettingsSolarWind;
