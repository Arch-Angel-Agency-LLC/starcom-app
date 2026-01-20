import React from 'react';
import type { SpaceWeatherPassiveBundle } from './SpaceWeatherSidebarLayout';

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '8px 10px',
  borderRadius: 6,
  background: 'linear-gradient(180deg, rgba(4,16,28,0.92), rgba(2,8,16,0.9))',
  border: '1px solid rgba(80,170,255,0.28)',
  color: '#e6f4ff',
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

const chipStyle: React.CSSProperties = {
  fontSize: 10,
  borderRadius: 4,
  padding: '2px 6px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.04)'
};

const freshnessBadgeBase: React.CSSProperties = {
  fontSize: 10,
  borderRadius: 999,
  padding: '2px 6px',
  border: '1px solid rgba(255,255,255,0.14)',
  textTransform: 'uppercase',
  fontWeight: 700
};

const shimmerBase: React.CSSProperties = {
  width: '70%',
  height: 10,
  borderRadius: 4,
  background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer-slide 1.3s linear infinite'
};

// Inject keyframes once in the browser
if (typeof document !== 'undefined' && !document.getElementById('sw-shimmer-style')) {
  const style = document.createElement('style');
  style.id = 'sw-shimmer-style';
  style.textContent = `@keyframes shimmer-slide { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
  document.head.appendChild(style);
}

const freshnessPalette = {
  live: { bg: 'rgba(52, 199, 89, 0.24)', color: '#c9ffd6', label: 'Live' },
  stale: { bg: 'rgba(255, 149, 0, 0.2)', color: '#ffe0b3', label: 'Stale' },
  fallback: { bg: 'rgba(255, 204, 0, 0.18)', color: '#fff0b3', label: 'Fallback' },
  unknown: { bg: 'rgba(255,255,255,0.08)', color: '#e6f4ff', label: 'Unknown' }
};

const isLoading = (passive?: SpaceWeatherPassiveBundle | null, lastUpdate?: number | null) => {
  if (!passive) return false;
  const gating = passive.gatingReason ?? passive.telemetry?.gatingReason;
  return (!lastUpdate || Number.isNaN(lastUpdate)) && (gating === 'noData' || gating === 'inactiveLayer');
};

const computeFreshness = (lastUpdate?: number | null, staleMs = 10 * 60 * 1000) => {
  if (!lastUpdate) return { variant: 'unknown' as const, ageLabel: '—' };
  const ageMs = Date.now() - lastUpdate;
  const variant = ageMs > staleMs ? 'stale' : 'live';
  const minutes = Math.max(0, Math.floor(ageMs / 60000));
  return { variant, ageLabel: `${minutes}m ago` };
};

const resolveQualityVariant = (
  quality?: 'live' | 'fallback' | 'stale' | null,
  freshnessVariant?: keyof typeof freshnessPalette
): keyof typeof freshnessPalette => {
  if (quality && quality in freshnessPalette) return quality as keyof typeof freshnessPalette;
  if (freshnessVariant && freshnessVariant in freshnessPalette) return freshnessVariant;
  return 'unknown';
};

const formatTime = (value?: number | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return '—';
  }
};

const ShimmerRow: React.FC<{ width?: string | number }> = ({ width = '70%' }) => (
  <div data-testid="shimmer-row" style={{ ...shimmerBase, width }} />
);

const ValueOrShimmer: React.FC<{ loading: boolean; width?: string | number; children: React.ReactNode }> = ({
  loading,
  width,
  children
}) => (loading ? <ShimmerRow width={width} /> : <span>{children}</span>);

const QualityBadge: React.FC<{ variant: keyof typeof freshnessPalette }> = ({ variant }) => {
  const palette = freshnessPalette[variant] ?? freshnessPalette.unknown;
  return <span style={{ ...freshnessBadgeBase, background: palette.bg, color: palette.color }}>{palette.label}</span>;
};

const GeomagneticCard: React.FC<{ passive: SpaceWeatherPassiveBundle }> = ({ passive }) => {
  const geomag = passive.telemetry?.modes.geomagnetic;
  const freshness = computeFreshness(geomag?.lastUpdate, 90 * 60 * 1000);
  const qualityVariant = resolveQualityVariant(geomag?.quality, freshness.variant);
  const loading = isLoading(passive, geomag?.lastUpdate);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>Geomagnetic</span>
        <QualityBadge variant={qualityVariant} />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Kp Index</span>
        <ValueOrShimmer loading={loading} width="30%">{geomag?.kp ?? '—'}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Last Update</span>
        <ValueOrShimmer loading={loading} width="40%">{formatTime(geomag?.lastUpdate)}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Age</span>
        <ValueOrShimmer loading={loading} width="35%">{freshness.ageLabel}</ValueOrShimmer>
      </div>
    </div>
  );
};

const MagnetosphereCard: React.FC<{ passive: SpaceWeatherPassiveBundle }> = ({ passive }) => {
  const mag = passive.telemetry?.modes.magnetopause;
  const freshness = computeFreshness(mag?.lastUpdate, 10 * 60 * 1000);
  const qualityVariant = resolveQualityVariant(mag?.quality, freshness.variant);
  const loading = isLoading(passive, mag?.lastUpdate);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>Magnetosphere</span>
        <QualityBadge variant={qualityVariant} />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Stand-off</span>
        <ValueOrShimmer loading={loading} width="45%">
          {typeof mag?.standoffRe === 'number' ? `${mag.standoffRe.toFixed(1)} Re` : '—'}
        </ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Last Update</span>
        <ValueOrShimmer loading={loading} width="40%">{formatTime(mag?.lastUpdate)}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Age</span>
        <ValueOrShimmer loading={loading} width="35%">{freshness.ageLabel}</ValueOrShimmer>
      </div>
    </div>
  );
};

const SolarWindCard: React.FC<{ passive: SpaceWeatherPassiveBundle }> = ({ passive }) => {
  const sw = passive.telemetry?.modes.solarWind;
  const freshness = computeFreshness(sw?.lastUpdate, 10 * 60 * 1000);
  const qualityVariant = resolveQualityVariant(sw?.quality, freshness.variant);
  const loading = isLoading(passive, sw?.lastUpdate);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>Solar Wind</span>
        <QualityBadge variant={qualityVariant} />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Speed</span>
        <ValueOrShimmer loading={loading} width="45%">{sw?.speed ? `${sw.speed} km/s` : '—'}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Density</span>
        <ValueOrShimmer loading={loading} width="45%">{sw?.density ? `${sw.density} cm³` : '—'}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Bz</span>
        <ValueOrShimmer loading={loading} width="35%">{sw?.bz ? `${sw.bz} nT` : '—'}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Last Update</span>
        <ValueOrShimmer loading={loading} width="40%">{formatTime(sw?.lastUpdate)}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Age</span>
        <ValueOrShimmer loading={loading} width="35%">{freshness.ageLabel}</ValueOrShimmer>
      </div>
    </div>
  );
};

const AuroraCard: React.FC<{ passive: SpaceWeatherPassiveBundle }> = ({ passive }) => {
  const aurora = passive.telemetry?.modes.auroralOval;
  const kp = passive.telemetry?.modes.geomagnetic.kp;
  const freshness = computeFreshness(aurora?.lastUpdate ?? null, 90 * 60 * 1000);
  const qualityVariant = resolveQualityVariant(aurora?.quality, freshness.variant);
  const loading = isLoading(passive, aurora?.lastUpdate ?? null);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>Aurora</span>
        <QualityBadge variant={qualityVariant} />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Kp</span>
        <ValueOrShimmer loading={loading} width="30%">{kp ?? '—'}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Resolution</span>
        <ValueOrShimmer loading={loading} width="50%">
          {aurora?.resolution ? aurora.resolution.toUpperCase() : '—'}
        </ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Last Update</span>
        <ValueOrShimmer loading={loading} width="40%">{formatTime(aurora?.lastUpdate)}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Age</span>
        <ValueOrShimmer loading={loading} width="35%">{freshness.ageLabel}</ValueOrShimmer>
      </div>
    </div>
  );
};

const RadiationCard: React.FC<{ passive: SpaceWeatherPassiveBundle }> = ({ passive }) => {
  const rad = passive.telemetry?.modes.magneticField;
  const freshness = computeFreshness(rad?.lastUpdate, 30 * 60 * 1000);
  const qualityVariant = resolveQualityVariant(rad?.quality, freshness.variant);
  const loading = isLoading(passive, rad?.lastUpdate);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>Radiation Belts</span>
        <QualityBadge variant={qualityVariant} />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Samples</span>
        <ValueOrShimmer loading={loading} width="40%">{rad?.sampleCount ?? '—'}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Last Update</span>
        <ValueOrShimmer loading={loading} width="40%">{formatTime(rad?.lastUpdate)}</ValueOrShimmer>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Age</span>
        <ValueOrShimmer loading={loading} width="35%">{freshness.ageLabel}</ValueOrShimmer>
      </div>
    </div>
  );
};

export const SpaceWeatherLayerPassiveCard: React.FC<{
  layerId: string | null;
  passive?: SpaceWeatherPassiveBundle | null;
}> = ({ layerId, passive }) => {
  if (!layerId || !passive) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span>Space Weather</span>
          <span style={chipStyle}>HUD</span>
        </div>
        <div>No passive telemetry.</div>
      </div>
    );
  }

  switch (layerId) {
    case 'geomagneticIndex':
      return <GeomagneticCard passive={passive} />;
    case 'magnetosphere':
      return <MagnetosphereCard passive={passive} />;
    case 'solarWind':
      return <SolarWindCard passive={passive} />;
    case 'aurora':
      return <AuroraCard passive={passive} />;
    case 'radiation':
      return <RadiationCard passive={passive} />;
    default:
      return (
        <div style={cardStyle}>
          <div style={headerStyle}>
            <span>Space Weather</span>
            <span style={chipStyle}>HUD</span>
          </div>
          <div>Layer {layerId} has no passive view.</div>
        </div>
      );
  }
};
