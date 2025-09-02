// WS1 Normalization module
// Provides mapping & stats generation for geopolitical border classification & recognition matrix.

export type CanonicalClassification =
  | 'International'
  | 'Disputed'
  | 'LineOfControl'
  | 'Indefinite'
  | 'MaritimeEEZ'
  | 'MaritimeOverlap'
  | 'InternalPlaceholder'
  | 'Unknown';

export type PerspectiveRecognition = 'recognized' | 'unrecognized' | 'verify' | 'admin1' | 'blank';

export interface NormalizedBorderFeature {
  id: string;
  classification: CanonicalClassification;
  coordinates: [number, number][]; // flattened for now
  rawFeatureCla?: string;
  perspectives: Record<string, PerspectiveRecognition>;
}

export interface NormalizationStats {
  total: number;
  countsPerClass: Record<CanonicalClassification, number>;
  unknownPct: number;
  perspectivesCoverage: Record<PerspectiveRecognition, number>;
  perspectiveFieldCounts: Record<string, Record<PerspectiveRecognition, number>>;
}

// Ordered rule set (first match wins)
interface ClassificationRule { test: RegExp; value: CanonicalClassification }
const CLASSIFICATION_RULES: ClassificationRule[] = [
  { test: /disputed/i, value: 'Disputed' },
  { test: /line of control/i, value: 'LineOfControl' },
  { test: /indefinite/i, value: 'Indefinite' },
  { test: /eez/i, value: 'MaritimeEEZ' },
  { test: /overlap/i, value: 'MaritimeOverlap' }
];

function classify(raw: string | undefined): CanonicalClassification {
  if (!raw) return 'International';
  for (const r of CLASSIFICATION_RULES) if (r.test.test(raw)) return r.value;
  // Treat 'International boundary (verify)' as International unless later evidence suggests otherwise
  if (/international boundary/i.test(raw)) return 'International';
  if (/admin-?1/i.test(raw)) return 'InternalPlaceholder';
  return 'International';
}

function normalizePerspectiveValue(v: string | undefined): PerspectiveRecognition {
  if (!v) return 'blank';
  const lc = v.toLowerCase();
  if (lc.includes('international boundary')) return 'recognized';
  if (lc.includes('admin-1')) return 'admin1';
  if (lc.includes('unrecognized')) return 'unrecognized';
  if (lc.includes('verify')) return 'verify';
  return 'blank';
}

export function normalizeFeatures(raw: any[]): NormalizedBorderFeature[] {
  return raw
    .filter(f => f.geometry?.type === 'LineString') // MultiLine handled upstream before split
    .map(f => {
      const props = f.properties || {};
      const classification = classify(props.FEATURECLA);
      const perspectives: Record<string, PerspectiveRecognition> = {};
      Object.keys(props).forEach(k => {
        if (k.startsWith('FCLASS_')) {
          perspectives[k.substring(7)] = normalizePerspectiveValue(props[k]);
        }
      });
      return {
        id: props.NE_ID || props.BRK_A3 || f.id || 'border',
        classification,
        coordinates: f.geometry.coordinates,
        rawFeatureCla: props.FEATURECLA,
        perspectives
      } as NormalizedBorderFeature;
    });
}

export function computeStats(features: NormalizedBorderFeature[]): NormalizationStats {
  const countsPerClass: Record<CanonicalClassification, number> = {
    International: 0,
    Disputed: 0,
    LineOfControl: 0,
    Indefinite: 0,
    MaritimeEEZ: 0,
    MaritimeOverlap: 0,
    InternalPlaceholder: 0,
    Unknown: 0
  };
  const perspectivesCoverage: Record<PerspectiveRecognition, number> = {
    recognized: 0,
    unrecognized: 0,
    verify: 0,
    admin1: 0,
    blank: 0
  };
  const perspectiveFieldCounts: Record<string, Record<PerspectiveRecognition, number>> = {};

  features.forEach(f => {
    countsPerClass[f.classification]++;
    Object.entries(f.perspectives).forEach(([field, value]) => {
      perspectivesCoverage[value]++;
      if (!perspectiveFieldCounts[field]) {
        perspectiveFieldCounts[field] = { recognized: 0, unrecognized: 0, verify: 0, admin1: 0, blank: 0 };}
      perspectiveFieldCounts[field][value]++;
    });
  });

  const total = features.length;
  const unknownPct = total ? (countsPerClass.Unknown / total) * 100 : 0;

  return { total, countsPerClass, unknownPct, perspectivesCoverage, perspectiveFieldCounts };
}

export interface NormalizationReport { features: NormalizedBorderFeature[]; stats: NormalizationStats }

export function generateReport(raw: any[]): NormalizationReport {
  const normalized = normalizeFeatures(raw);
  const stats = computeStats(normalized);
  return { features: normalized, stats };
}
