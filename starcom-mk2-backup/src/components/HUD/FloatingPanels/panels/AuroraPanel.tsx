import React from 'react';
import { FloatingPanelData } from '../FloatingPanelContext';

interface AuroraPanelProps {
  data?: FloatingPanelData;
}

const AuroraPanel: React.FC<AuroraPanelProps> = ({ data }) => {
  // Mock aurora data - will connect to real NOAA data
  const auroraData = {
    activity: (data?.activity as string) || 'Moderate',
    kpIndex: (data?.kpIndex as number) || 4.2,
    visibility: (data?.visibility as string) || 'High Latitude',
    forecast: (data?.forecast as string) || 'Increasing',
    lastUpdate: (data?.lastUpdate as string) || new Date().toLocaleTimeString()
  };

  const getActivityColor = (activity: string) => {
    switch (activity.toLowerCase()) {
      case 'low': return '#00ff88';
      case 'moderate': return '#ffaa00';
      case 'high': return '#ff6b6b';
      default: return '#94a3b8';
    }
  };

  return (
    <div>
      <h3>🌌 Aurora Activity</h3>
      <div className="dataGrid">
        <div className="dataItem">
          <div className="dataLabel">Activity Level</div>
          <div 
            className="dataValue" 
            style={{ color: getActivityColor(auroraData.activity) }}
          >
            {auroraData.activity}
          </div>
        </div>
        <div className="dataItem">
          <div className="dataLabel">Kp Index</div>
          <div className="dataValue">{auroraData.kpIndex}</div>
        </div>
      </div>
      
      <p>
        <span className="dataLabel">Visibility:</span> {auroraData.visibility}
      </p>
      <p>
        <span className="dataLabel">Forecast:</span> 
        <span className={`dataValue ${auroraData.forecast === 'Increasing' ? 'trendUp' : 'trendStable'}`}>
          {auroraData.forecast} {auroraData.forecast === 'Increasing' ? '↗' : '→'}
        </span>
      </p>
      
      <div style={{ marginTop: '12px' }}>
        <button className="actionBtn">📷 Aurora Cam</button>
        <button className="actionBtn">📊 Details</button>
      </div>
      
      <div style={{ marginTop: '8px', fontSize: '0.6rem', color: '#64748b' }}>
        Updated: {auroraData.lastUpdate}
      </div>
    </div>
  );
};

export default AuroraPanel;
