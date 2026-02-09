import React from 'react';
import type { SpaceWeatherPassiveBundle } from './SpaceWeatherSidebarLayout';
import type { SpaceWeatherAlert } from '../../types/data/spaceWeather';

interface SpaceWeatherAlertPanelProps {
  passive?: SpaceWeatherPassiveBundle | null;
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '8px 10px',
  borderRadius: 6,
  background: 'linear-gradient(180deg, rgba(5,18,28,0.95), rgba(2,8,18,0.92))',
  border: '1px solid rgba(68,153,255,0.3)',
  color: '#e4f4ff',
  fontSize: 11,
  lineHeight: 1.4
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.5
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  opacity: 0.75
};

const alertListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const alertRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '6px 8px',
  borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)'
};

const alertMetaStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.4
};

const messageStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#f8fbff'
};

const regionStyle: React.CSSProperties = {
  fontSize: 10,
  opacity: 0.8
};

const emptyStateStyle: React.CSSProperties = {
  fontStyle: 'italic',
  opacity: 0.65,
  fontSize: 11
};

const severityPalette: Record<SpaceWeatherAlert['severity'], { label: string; color: string }> = {
  low: { label: 'Low', color: '#7de0b6' },
  moderate: { label: 'Moderate', color: '#ffd97d' },
  high: { label: 'High', color: '#ffb47d' },
  extreme: { label: 'Extreme', color: '#ff7d7d' }
};

const formatTimestamp = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return timestamp;
  }
};

const renderAlert = (alert: SpaceWeatherAlert) => {
  const palette = severityPalette[alert.severity];
  return (
    <div key={alert.id} style={alertRowStyle}>
      <div style={alertMetaStyle}>
        <span style={{ color: palette.color }}>{palette.label}</span>
        <span>{alert.alertType.replace(/_/g, ' ')}</span>
        <span>{formatTimestamp(alert.timestamp)}</span>
      </div>
      <div style={messageStyle}>{alert.message}</div>
      {alert.regions.length > 0 && (
        <div style={regionStyle}>{alert.regions.join(', ')}</div>
      )}
    </div>
  );
};

export const SpaceWeatherAlertPanel: React.FC<SpaceWeatherAlertPanelProps> = ({ passive }) => {
  const alerts = passive?.alerts ?? [];
  const enhancedAlerts = passive?.enhancedAlerts ?? [];
  const hasAlerts = alerts.length > 0 || enhancedAlerts.length > 0;

  if (!passive || !hasAlerts) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>Space Weather Alerts</div>
        <div style={emptyStateStyle}>No alerts in the last window.</div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>Space Weather Alerts</div>
      {alerts.length > 0 && (
        <div>
          <div style={sectionLabelStyle}>Realtime feed</div>
          <div style={alertListStyle}>{alerts.map(renderAlert)}</div>
        </div>
      )}
      {enhancedAlerts.length > 0 && (
        <div>
          <div style={sectionLabelStyle}>Correlation warnings</div>
          <div style={alertListStyle}>{enhancedAlerts.map(renderAlert)}</div>
        </div>
      )}
    </div>
  );
};

export default SpaceWeatherAlertPanel;
