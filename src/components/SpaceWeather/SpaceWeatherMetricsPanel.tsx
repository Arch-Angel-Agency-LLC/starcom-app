import React from 'react';
import { useSpaceWeatherContext } from '../../context/SpaceWeatherContext';
import { useVisualizationMode } from '../../context/VisualizationModeContext';

const wrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 11,
  fontFamily: 'monospace',
  padding: '6px 8px',
  background: 'linear-gradient(180deg, rgba(0,20,40,0.55), rgba(0,0,0,0.35))',
  border: '1px solid rgba(0,200,255,0.25)',
  borderRadius: 4,
  color: '#e1faff'
};

const header: React.CSSProperties = { fontWeight: 600, fontSize: 12, letterSpacing: 0.5 };
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8 };
const badgeBase: React.CSSProperties = { padding: '1px 4px', borderRadius: 3, fontSize: 10, fontWeight: 600 };

export const SpaceWeatherMetricsPanel: React.FC = () => {
  const { visualizationMode } = useVisualizationMode();
  const { telemetry } = useSpaceWeatherContext();

  const active = visualizationMode.mode === 'EcoNatural' && visualizationMode.subMode === 'SpaceWeather';
  if (!active || !telemetry) return null;

  const degraded = telemetry.degraded;

  return (
    <div style={wrapper}>
      <div style={header}>Space Weather Telemetry</div>
      <div style={row}><span>Raw InterMag</span><span>{telemetry.rawInterMag}</span></div>
      <div style={row}><span>Raw US/CA</span><span>{telemetry.rawUSCanada}</span></div>
      <div style={row}><span>Combined</span><span>{telemetry.combinedRaw}</span></div>
      <div style={row}><span>Sampled</span><span>{telemetry.sampled}</span></div>
      <div style={row}><span>Rendered</span><span>{telemetry.rendered}</span></div>
      <div style={row}><span>Strategy</span><span>{telemetry.samplingStrategy}</span></div>
      <div style={row}><span>Unit</span><span>{telemetry.unit}</span></div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 0 4px' }} />
      <div style={row}><span>Sampling ms</span><span>{telemetry.timings.samplingMs.toFixed(1)}</span></div>
      <div style={row}><span>Norm ms</span><span>{telemetry.timings.normalizationMs.toFixed(1)}</span></div>
      <div style={row}><span>Total ms</span><span>{telemetry.timings.totalMs.toFixed(1)}</span></div>
      <div style={row}><span>Status</span><span style={{ ...badgeBase, background: degraded ? 'rgba(255,60,60,0.35)' : 'rgba(40,200,120,0.35)', color: degraded ? '#ff8080' : '#b4ffd9' }}>{degraded ? 'DEGRADED' : 'OPTIMAL'}</span></div>
      {degraded && (
        <div style={row}><span>Stages</span><span>{telemetry.degradationStages.join(', ') || '—'}</span></div>
      )}
    </div>
  );
};

export default SpaceWeatherMetricsPanel;
