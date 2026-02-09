import React from 'react';
import styles from './SpaceWeatherDetailsPopover.module.css';

type ProviderKey = 'legacy' | 'enterprise' | 'enhanced';

type ProviderStatus = {
  available: boolean;
  lastTested?: Date;
  error?: string;
};

interface SpaceWeatherDetailsPopoverProps {
  onClose: () => void;
  providerMeta: Record<ProviderKey, { label: string; detail: string; icon: string }>;
  providerStatus: Record<ProviderKey, ProviderStatus>;
  telemetry?: {
    rawInterMag: number;
    rawUSCanada: number;
    rawPipeline: number;
    samplingStrategy: 'legacy-topN' | 'grid-binning';
  };
}

const SpaceWeatherDetailsPopover: React.FC<SpaceWeatherDetailsPopoverProps> = ({
  onClose,
  providerMeta,
  providerStatus,
  telemetry
}) => {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Space Weather Details</div>
            <div className={styles.subtitle}>Providers · Datasets · Sampling</div>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Providers</div>
          <p className={styles.paragraph}>
            Providers are auto-selected with failover; the sidebar shows health only. No manual switching is required.
          </p>
          <ul className={styles.list}>
            {(Object.keys(providerMeta) as ProviderKey[]).map((key) => {
              const meta = providerMeta[key];
              const status = providerStatus[key];
              const badge = status?.available === false ? 'Unavailable' : 'Ready';
              const detail = status?.error || meta.detail;
              return (
                <li key={key}>
                  <span className={styles.listIcon}>{meta.icon}</span>
                  <div>
                    <div className={styles.listLabel}>{meta.label} · {badge}</div>
                    <div className={styles.listDetail}>{detail}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Datasets</div>
          <p className={styles.paragraph}>
            InterMag + US/Canada represent the live NOAA feeds. Pipeline taps enterprise adapters for fused coverage.
            Toggle feeds in the left sidebar to focus on individual regions or lean on the pipeline for density.
          </p>
          <div className={styles.datasetGrid}>
            <div>
              <span className={styles.datasetLabel}>InterMag</span>
              <span className={styles.datasetValue}>{telemetry?.rawInterMag ?? 0}</span>
            </div>
            <div>
              <span className={styles.datasetLabel}>US/Canada</span>
              <span className={styles.datasetValue}>{telemetry?.rawUSCanada ?? 0}</span>
            </div>
            <div>
              <span className={styles.datasetLabel}>Pipeline</span>
              <span className={styles.datasetValue}>{telemetry?.rawPipeline ?? 0}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Sampling</div>
          <p className={styles.paragraph}>
            Legacy mode prioritizes the strongest vectors (top-N). Grid mode spreads samples evenly by latitude/longitude bins.
            Adjust bin size, cap, and magnitude floor from the compact controls to shape the visualization workload.
          </p>
          <div className={styles.badgeRow}>
            <span className={styles.strategyBadge}>{telemetry?.samplingStrategy === 'grid-binning' ? 'Grid Binning' : 'Legacy Top-N'}</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SpaceWeatherDetailsPopover;
