import React from 'react';
import { FloatingPanelData } from '../FloatingPanelContext';

interface SolarFlarePanelProps {
  data?: FloatingPanelData;
}

const SolarFlarePanel: React.FC<SolarFlarePanelProps> = ({ data }) => {
  // Mock solar flare data - will connect to real NOAA data
  const flareData = {
    class: (data?.class as string) || 'M5.2',
    region: (data?.region as string) || 'AR3536',
    peak: (data?.peak as string) || '14:32 UTC',
    duration: (data?.duration as string) || '12 min',
    impact: (data?.impact as string) || 'Radio Blackout',
    satellites: (data?.satellites as number) || 7
  };

  const getFlareColor = (flareClass: string) => {
    const level = flareClass.charAt(0);
    switch (level) {
      case 'X': return '#ff4444';
      case 'M': return '#ffaa00';
      case 'C': return '#00c4ff';
      case 'B': return '#00ff88';
      default: return '#94a3b8';
    }
  };

  const getImpactSeverity = (impact: string) => {
    if (impact.includes('Radio Blackout')) return 'statusWarning';
    if (impact.includes('Radiation Storm')) return 'statusCritical';
    return 'statusGood';
  };

  return (
    <div>
      <h3>☀️ Solar Flare Event</h3>
      
      <div className="dataGrid">
        <div className="dataItem">
          <div className="dataLabel">Flare Class</div>
          <div 
            className="dataValue" 
            style={{ color: getFlareColor(flareData.class) }}
          >
            {flareData.class}
          </div>
        </div>
        <div className="dataItem">
          <div className="dataLabel">Active Region</div>
          <div className="dataValue">{flareData.region}</div>
        </div>
      </div>

      <div className="dataGrid">
        <div className="dataItem">
          <div className="dataLabel">Peak Time</div>
          <div className="dataValue">{flareData.peak}</div>
        </div>
        <div className="dataItem">
          <div className="dataLabel">Duration</div>
          <div className="dataValue">{flareData.duration}</div>
        </div>
      </div>

      <div style={{ margin: '12px 0' }}>
        <div className="dataLabel">Current Impact:</div>
        <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center' }}>
          <span className={`statusIndicator ${getImpactSeverity(flareData.impact)}`}></span>
          {flareData.impact}
        </p>
        <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
          {flareData.satellites} satellites affected
        </p>
      </div>

      <div style={{ marginTop: '12px' }}>
        <button className="actionBtn">🛰️ Satellite Status</button>
        <button className="actionBtn">📡 Radio Impact</button>
        <button className="actionBtn">⚠️ Warnings</button>
      </div>

      <div style={{ marginTop: '8px', fontSize: '0.6rem', color: '#64748b' }}>
        Real-time monitoring active
      </div>
    </div>
  );
};

export default SolarFlarePanel;
