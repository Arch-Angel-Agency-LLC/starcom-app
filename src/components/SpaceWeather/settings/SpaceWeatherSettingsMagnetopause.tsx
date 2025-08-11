import React from 'react';
import { useEcoNaturalSettings } from '../../../hooks/useEcoNaturalSettings';

// Placeholder settings UI for Magnetopause mode
const section: React.CSSProperties = { fontSize: 10, letterSpacing: 0.5, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', marginTop: 2 };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 };

const SpaceWeatherSettingsMagnetopause: React.FC = () => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const sw = config.spaceWeather;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={section}>Basic</div>
      <div style={row} title="Toggle magnetopause stand-off visualization (stub)">
        <label>Magnetopause</label>
        <input type="checkbox" checked={sw.showMagnetopause} onChange={e => updateSpaceWeather({ showMagnetopause: e.target.checked })} />
      </div>
      <div style={section}>Advanced</div>
      <div style={{ fontSize: 11, opacity: 0.65 }}>Future: model selection, empirical vs physics-based.</div>
    </div>
  );
};
export default SpaceWeatherSettingsMagnetopause;
