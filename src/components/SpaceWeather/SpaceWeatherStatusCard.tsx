import React from 'react';
import type {
  SpaceWeatherInteractiveBundle,
  SpaceWeatherPassiveBundle
} from './SpaceWeatherSidebarLayout';

interface SpaceWeatherStatusCardProps {
  interactive?: SpaceWeatherInteractiveBundle | null;
  passive?: SpaceWeatherPassiveBundle | null;
}

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '8px 10px',
  borderRadius: 6,
  background: 'linear-gradient(180deg, rgba(2, 18, 35, 0.9), rgba(1, 8, 16, 0.85))',
  border: '1px solid rgba(60, 150, 220, 0.3)',
  color: '#e3f5ff',
  fontSize: 11,
  lineHeight: 1.4
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.4
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 11
};

const labelStyle: React.CSSProperties = {
  opacity: 0.7,
  fontWeight: 500
};

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4
};

const datasetChipBase: React.CSSProperties = {
  fontSize: 10,
  borderRadius: 999,
  padding: '2px 6px',
  border: '1px solid rgba(255,255,255,0.25)'
};

const providerRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4
};

const providerItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
  padding: '2px 4px',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.03)'
};

const providerBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  borderRadius: 4,
  padding: '1px 4px',
  fontWeight: 600
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  opacity: 0.7,
  marginTop: 2
};

const statusBadgeBase: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase'
};

type StatusVariant = 'nominal' | 'degraded' | 'blocked';

const statusPalette: Record<StatusVariant, { background: string; color: string; label: string }> = {
  nominal: { background: 'rgba(46, 189, 133, 0.25)', color: '#b7ffd7', label: 'Nominal' },
  degraded: { background: 'rgba(255, 166, 46, 0.25)', color: '#ffd59b', label: 'Degraded' },
  blocked: { background: 'rgba(255, 82, 82, 0.25)', color: '#ffb0b0', label: 'Blocked' }
};

const gatingNoticeStyle: React.CSSProperties = {
  background: 'rgba(255, 110, 110, 0.12)',
  color: '#ffc7c7',
  border: '1px solid rgba(255, 110, 110, 0.35)',
  borderRadius: 4,
  padding: '6px 8px',
  fontSize: 10,
  lineHeight: 1.4
};

const datasetLabels: Record<keyof SpaceWeatherInteractiveBundle['datasetFlags'], string> = {
  intermag: 'InterMag',
  usCanada: 'US/Canada',
  pipeline: 'Pipeline'
};

const formatTimestamp = (timestamp?: number | null) => {
  if (!timestamp) return '—';
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return '—';
  }
};

const formatGatingReason = (gating: SpaceWeatherPassiveBundle['gatingReason']) => {
  switch (gating) {
    case 'disabled':
      return 'Disabled';
    case 'inactiveLayer':
      return 'Inactive layer';
    case 'noData':
      return 'Awaiting data';
    default:
      return 'Operational';
  }
};

export const SpaceWeatherStatusCard: React.FC<SpaceWeatherStatusCardProps> = ({ interactive, passive }) => {
  if (!interactive || !passive || !passive.telemetry) {
    return null;
  }

  const telemetry = passive.telemetry;
  const datasetFlags = interactive.datasetFlags;
  const providerEntries = passive.providerStatus;
  const lastUpdate = passive.lastLayerTimestamp ?? passive.lastContextUpdate;
  const gating = passive.gatingReason;

  const statusVariant: StatusVariant = gating ? 'blocked' : telemetry.degraded ? 'degraded' : 'nominal';
  const statusPaletteEntry = statusPalette[statusVariant];
  const gatingLabel = formatGatingReason(gating);

  const enabledDatasets = (Object.keys(datasetFlags) as Array<keyof SpaceWeatherInteractiveBundle['datasetFlags']>)
    .filter((key) => datasetFlags[key]);

  const degradationLabel = telemetry.degraded
    ? (telemetry.degradationStages.length ? `Stages ${telemetry.degradationStages.join(', ')}` : 'Active')
    : 'None';

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <span>Space Weather Status</span>
        <span style={{ ...statusBadgeBase, background: statusPaletteEntry.background, color: statusPaletteEntry.color }}>
          {statusPaletteEntry.label}
        </span>
      </div>

      {gating && (
        <div style={gatingNoticeStyle}>
          Rendering limited: {gatingLabel}. Switch to Electric Fields or enable the selected layer to resume overlays.
        </div>
      )}

      <div style={rowStyle}>
        <span style={labelStyle}>Layer</span>
        <span>{interactive.layer?.label ?? 'Electric Fields'}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Last Update</span>
        <span>{formatTimestamp(lastUpdate)}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Telemetry</span>
        <span>{telemetry.sampled.toLocaleString()} / {telemetry.rendered.toLocaleString()}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Gating</span>
        <span>{gatingLabel}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Degradation</span>
        <span>{degradationLabel}</span>
      </div>

      <div style={sectionLabelStyle}>Datasets</div>
      <div style={chipRowStyle}>
        {enabledDatasets.length > 0 ? (
          enabledDatasets.map((key) => (
            <span
              key={key}
              style={{
                ...datasetChipBase,
                background: 'rgba(255,255,255,0.05)',
                color: '#e5f6ff'
              }}
            >
              {datasetLabels[key]}
            </span>
          ))
        ) : (
          <span style={{ ...datasetChipBase, background: 'rgba(255,255,255,0.05)', color: '#ffb0b0' }}>None Enabled</span>
        )}
      </div>

      <div style={sectionLabelStyle}>Providers</div>
      <div style={providerRowStyle}>
        {providerEntries.map((entry) => {
          const active = entry.key === passive.currentProvider;
          const availabilityLabel = entry.available ? 'Available' : 'Offline';
          return (
            <div key={entry.key} style={providerItemStyle}>
              <span>
                {entry.label}
                {active ? ' • Active' : ''}
              </span>
              <span
                style={{
                  ...providerBadgeStyle,
                  background: entry.available ? 'rgba(40, 200, 120, 0.25)' : 'rgba(255, 110, 110, 0.25)',
                  color: entry.available ? '#b6ffd7' : '#ffc7c7'
                }}
              >
                {availabilityLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpaceWeatherStatusCard;
