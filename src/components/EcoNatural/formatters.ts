import { type NaturalEvent } from '../../hooks/useGeoEvents';

const formatUtcIso = (timestamp?: string): string => {
  if (!timestamp) return 'Time: unknown';
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return 'Time: unknown';
  return new Date(parsed).toISOString();
};

const formatMagnitude = (magnitude?: number): string | null => {
  if (typeof magnitude !== 'number' || !Number.isFinite(magnitude)) return null;
  return `M${magnitude.toFixed(1)}`;
};

export const formatEcoDisasterTooltip = (event: NaturalEvent): string => {
  const parts: string[] = [];
  const magnitude = formatMagnitude(event.magnitude);
  if (magnitude) parts.push(magnitude);

  if (event.type) parts.push(event.type);

  if (event.severityBucket) parts.push(`Severity: ${event.severityBucket}`);

  const time = formatUtcIso(event.timestamp);
  parts.push(`UTC ${time}`);

  if (event.isMock || event.source === 'volcano-mock') {
    parts.push('Mock volcano data');
  } else if (event.source) {
    parts.push(`Source: ${event.source}`);
  }

  return parts.join(' • ');
};

export const formatEcoDisasterLabel = (event: NaturalEvent): string => {
  const magnitude = formatMagnitude(event.magnitude);
  const base = [magnitude, event.type].filter(Boolean).join(' ') || event.description || event.type || 'Event';
  if (event.isMock || event.source === 'volcano-mock') return `${base} (mock)`;
  return base;
};

export const formatUtcIsoShort = (timestamp?: string | number | null): string => {
  if (!timestamp && timestamp !== 0) return '—';
  const value = typeof timestamp === 'number' ? timestamp : Date.parse(String(timestamp));
  if (!Number.isFinite(value)) return '—';
  return new Date(value).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
};

export const EcoNaturalFormatters = {
  formatUtcIso,
  formatMagnitude,
  formatEcoDisasterTooltip,
  formatEcoDisasterLabel,
  formatUtcIsoShort
};

export default EcoNaturalFormatters;