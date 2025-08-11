import React from 'react';
import { useEcoNaturalSettings } from '../../../hooks/useEcoNaturalSettings';

// Placeholder settings for Geomagnetic Index layer (not yet wired to data)
const section: React.CSSProperties = { fontSize: 10, letterSpacing: 0.5, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', marginTop: 2 };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 };
const input: React.CSSProperties = { flex: 1, fontSize: 11, background: 'rgba(255,255,255,0.05)', color: '#e8ffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 3, padding: '2px 4px' };

const SpaceWeatherSettingsGeomagnetic: React.FC = () => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const g = config.spaceWeather;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={section}>Basic</div>
      <div style={row} title="Show Kp index overlay (placeholder)">
        <label>Kp Index</label>
        <input type="checkbox" checked={g.showKpIndex} onChange={e => updateSpaceWeather({ showKpIndex: e.target.checked })} />
      </div>
      <div style={section}>Medium</div>
      <div style={row} title="Time window (hours) for geomagnetic aggregation">
        <label>Time Window</label>
        <input
          style={input}
          type="number"
          min={1}
          max={168}
          value={g.timeWindow}
          onChange={e => updateSpaceWeather({ timeWindow: parseInt(e.target.value) || 24 })}
        />
      </div>
      <div style={section}>Advanced</div>
      <div style={{ fontSize: 11, opacity: 0.65 }}>Advanced geomagnetic controls will appear here as integration progresses.</div>
    </div>
  );
};
export default SpaceWeatherSettingsGeomagnetic;
