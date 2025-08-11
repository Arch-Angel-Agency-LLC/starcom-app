import React from 'react';
import { useSpaceWeatherContext } from '../../../context/SpaceWeatherContext';

const group: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 };
const input: React.CSSProperties = { flex: 1, fontSize: 11, background: 'rgba(255,255,255,0.05)', color: '#e8ffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 3, padding: '2px 4px' };
const section: React.CSSProperties = { fontSize: 10, letterSpacing: 0.5, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', marginTop: 2 };

// Basic/Medium/Advanced grouping (initial minimal controls; expand iteratively)
const SpaceWeatherSettingsElectricFields: React.FC = () => {
  const { settings, updateSettings, isElectricFieldsEnabled } = useSpaceWeatherContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={section}>Basic</div>
      <div style={group}>
        <div style={row} title="Toggle electric field visualization">
          <label style={{ fontWeight: 500 }}>E-Fields</label>
          <span style={{ fontSize: 10, color: isElectricFieldsEnabled ? '#3cffb0' : '#ff6666' }}>{isElectricFieldsEnabled ? 'ON' : 'OFF'}</span>
        </div>
        <div style={row} title="Scale applied to rendered vector glyph size">
          <label>Vector Scale</label>
          <input
            style={input}
            type="number"
            min={0.1}
            max={5}
            step={0.1}
            value={settings.vectorScale}
            onChange={e => updateSettings({ vectorScale: parseFloat(e.target.value) || 1 })}
          />
        </div>
      </div>
      <div style={section}>Medium</div>
      <div style={group}>
        <div style={row} title="Enable spatial fairness sampling grid (5° bins)">
          <label>Enhanced Sampling</label>
          <input
            type="checkbox"
            checked={settings.enhancedSampling}
            onChange={e => updateSettings({ enhancedSampling: e.target.checked })}
          />
        </div>
        <div style={row} title="Activate adapter pipeline (Phase 1 scaffold)">
          <label>Pipeline</label>
          <input
            type="checkbox"
            checked={settings.pipelineEnabled}
            onChange={e => updateSettings({ pipelineEnabled: e.target.checked })}
          />
        </div>
      </div>
      <div style={section}>Advanced</div>
      <div style={group}>
        <div style={row} title="Normalization strategy for magnitude distribution">
          <label>Method</label>
          <select
            style={input}
            value={settings.normalization.method}
            onChange={e => {
              const value = e.target.value as typeof settings.normalization.method;
              updateSettings({ normalization: { ...settings.normalization, method: value } });
            }}
          >
            <option value="linear">linear</option>
            <option value="log">log</option>
            <option value="percentile">percentile</option>
            <option value="statistical">statistical</option>
            <option value="adaptive">adaptive</option>
          </select>
        </div>
        <div style={row} title="Outlier attenuation multiplier (higher = more compression)">
          <label>Outlier x</label>
          <input
            style={input}
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={settings.normalization.outlierFactor}
            onChange={e => updateSettings({ normalization: { ...settings.normalization, outlierFactor: parseFloat(e.target.value) } })}
          />
        </div>
        <div style={row} title="Temporal smoothing factor (0 = none)">
          <label>Smoothing</label>
          <input
            style={input}
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={settings.normalization.smoothingFactor}
            onChange={e => updateSettings({ normalization: { ...settings.normalization, smoothingFactor: parseFloat(e.target.value) } })}
          />
        </div>
      </div>
    </div>
  );
};

export default SpaceWeatherSettingsElectricFields;
