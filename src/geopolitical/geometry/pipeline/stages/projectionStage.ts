// projectionStage.ts - helpers to determine projection strategy for geometry pipeline

export type ProjectionMode = 'legacy' | 'tangent' | 'lambert';

interface NormalizationSummary {
  classification: string;
  parts: unknown[];
  span: number;
}

function getGeoProjOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get('geoProj');
  } catch (_err) {
    return null;
  }
}

export function determineProjectionMode(summary: NormalizationSummary): ProjectionMode {
  const override = getGeoProjOverride();
  if (override === 'tangent') return 'tangent';
  if (override === 'lambert') return 'lambert';
  if (override === 'legacy') return 'legacy';
  if (override === 'auto') {
    if (summary.classification === 'polar') return 'lambert';
    if ((summary.parts?.length ?? 0) > 1 || summary.span > 40) return 'tangent';
  }
  // Default heuristic if no explicit override
  if (summary.classification === 'polar') return 'lambert';
  if ((summary.parts?.length ?? 0) > 1 || summary.span > 60) return 'tangent';
  return 'legacy';
}
