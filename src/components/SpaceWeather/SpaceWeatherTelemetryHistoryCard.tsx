import React from 'react';
import type { SpaceWeatherContextType } from '../../context/SpaceWeatherContext';
import { spaceWeatherProviderMeta } from './SpaceWeatherProviderMeta';
import styles from './SpaceWeatherControlSurface.module.css';

const formatLastUpdate = (timestamp?: number | null) => {
  if (!timestamp) return '--';
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return '--';
  }
};

const formatStatusLabel = (entry: SpaceWeatherContextType['telemetryHistory'][number]) => {
  if (entry.gatingReason === 'inactiveLayer') return 'Inactive';
  if (entry.gatingReason === 'disabled') return 'Disabled';
  if (entry.gatingReason === 'noData') return 'No Data';
  if (entry.degradationStages.length > 0) return 'Degraded';
  return 'Nominal';
};

interface SpaceWeatherTelemetryHistoryCardProps {
  entries?: SpaceWeatherContextType['telemetryHistory'];
  maxEntries?: number;
}

export const SpaceWeatherTelemetryHistoryCard: React.FC<SpaceWeatherTelemetryHistoryCardProps> = ({ entries = [], maxEntries = 4 }) => {
  const history = entries.slice(0, maxEntries);
  if (!history.length) {
    return null;
  }

  return (
    <div className={styles.telemetryHistory} aria-live="polite">
      <div className={styles.telemetryHistoryHeader}>
        <span>Telemetry</span>
        <span className={styles.telemetryHistoryRange}>Last {history.length}</span>
      </div>
      <div className={styles.telemetryHistoryList}>
        {history.map((entry, index) => {
          const previousEntry = history[index + 1];
          const delta = typeof previousEntry === 'undefined' ? null : entry.sampled - previousEntry.sampled;
          const deltaClass = delta === null
            ? styles.telemetryDeltaNeutral
            : delta > 0
              ? styles.telemetryDeltaPositive
              : delta < 0
                ? styles.telemetryDeltaNegative
                : styles.telemetryDeltaNeutral;
          const deltaLabel = delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}`;
          const providerInfo = spaceWeatherProviderMeta[entry.provider as keyof typeof spaceWeatherProviderMeta];
          const datasetSummary = Object.entries(entry.datasetFlags)
            .filter(([, enabled]) => enabled)
            .map(([key]) => {
              if (key === 'intermag') return 'IM';
              if (key === 'usCanada') return 'US';
              if (key === 'pipeline') return 'Pipe';
              return key;
            }).join(' · ') || 'None';
          const statusLabel = formatStatusLabel(entry);
          const statusClass = (entry.gatingReason || entry.degradationStages.length)
            ? styles.telemetryStatusWarn
            : styles.telemetryStatusOk;

          return (
            <div key={entry.timestamp} className={styles.telemetryHistoryRow}>
              <div className={styles.telemetryHistoryRowHeader}>
                <span className={styles.telemetryTime}>{formatLastUpdate(entry.timestamp)}</span>
                <span className={styles.telemetryProvider}>
                  <span className={styles.telemetryProviderIcon}>{providerInfo?.icon ?? '📡'}</span>
                  <span>{providerInfo?.label ?? entry.provider}</span>
                </span>
              </div>
              <div className={styles.telemetryHistoryRowBody}>
                <div className={styles.telemetryCounts}>
                  <span className={styles.telemetrySamples}>
                    {entry.sampled.toLocaleString()} / {entry.rendered.toLocaleString()}
                  </span>
                  <span className={[styles.telemetryDelta, deltaClass].filter(Boolean).join(' ')}>{deltaLabel}</span>
                </div>
                <div className={styles.telemetryStatusRow}>
                  <span className={[styles.telemetryStatus, statusClass].filter(Boolean).join(' ')}>{statusLabel}</span>
                  <span className={styles.telemetryDatasets}>{datasetSummary}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpaceWeatherTelemetryHistoryCard;
