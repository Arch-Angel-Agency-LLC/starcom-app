// NationalTerritoriesService: loads and builds border / territory geometry
import * as THREE from 'three';
import { GeometryFactory, LineFeature, PolygonFeature } from '../geometry/geometryFactory';
// Corrected path to GeoPoliticalConfig
import { GeoPoliticalConfig } from '../../hooks/useGeoPoliticalSettings';
import { resolveBorderMaterialConfig, createLineMaterial, BorderClassification } from '../theme/materialTheme';

export interface WorldBordersData { features: Array<{ id: string; coordinates: [number, number][] }> }
export interface WorldTerritoriesData { features: Array<{ id: string; rings: [number, number][][] }> }

interface ClassifiedLineFeature extends LineFeature { classification: BorderClassification }
interface MaritimeFeature extends LineFeature { classification: BorderClassification }

// --- WS1 Normalization Scaffold ---
// Canonical normalization tokens mapped to classification categories
const FEATURE_CLA_MAP: { test: RegExp; value: BorderClassification }[] = [
  { test: /disputed/i, value: 'disputed' },
  { test: /line of control/i, value: 'line_of_control' },
  { test: /indefinite/i, value: 'indefinite' }
];

function normalizeFeatureCla(raw: string | undefined): BorderClassification {
  if (!raw) return 'international';
  for (const rule of FEATURE_CLA_MAP) {
    if (rule.test.test(raw)) return rule.value;
  }
  if (/verify/i.test(raw)) {
    // keep as international but may flag unknown later
    return 'international';
  }
  return 'international';
}

// Perspective recognition value normalization
export type PerspectiveRecognition = 'recognized' | 'unrecognized' | 'verify' | 'admin1' | 'blank';

function normalizePerspectiveValue(v: string | undefined): PerspectiveRecognition {
  if (!v) return 'blank';
  const lc = v.toLowerCase();
  if (lc.includes('international boundary')) return 'recognized';
  if (lc.includes('admin-1')) return 'admin1';
  if (lc.includes('unrecognized')) return 'unrecognized';
  if (lc.includes('verify')) return 'verify';
  return 'blank';
}

export interface RecognitionMatrixEntry {
  featureId: string;
  classification: BorderClassification;
  perspectives: Record<string, PerspectiveRecognition>;
}

function buildRecognitionMatrix(rawFeatures: any[]): RecognitionMatrixEntry[] {
  return rawFeatures.map(f => {
    const props = f.properties || {};
    const classification = normalizeFeatureCla(props.FEATURECLA);
    const perspectives: Record<string, PerspectiveRecognition> = {};
    Object.keys(props).forEach(k => {
      if (k.startsWith('FCLASS_')) {
        perspectives[k.substring('FCLASS_'.length)] = normalizePerspectiveValue(props[k]);
      }
    });
    return { featureId: props.NE_ID || props.BRK_A3 || f.id || 'border', classification, perspectives };
  });
}
// --- End WS1 Scaffold ---

function isDisputed(classification: BorderClassification) {
  return classification === 'disputed' || classification === 'line_of_control' || classification === 'indefinite';
}

export class NationalTerritoriesService {
  private cache: Map<string, unknown> = new Map();

  private borderFileForLOD(lod: 0 | 1 | 2) { return `/geopolitical/world-borders-lod${lod}.geojson`; }
  private normalizedBorderFileForLOD(lod: 0 | 1 | 2) { return `/geopolitical/normalized/world-borders-lod${lod}.normalized.json`; }
  private territoryFileForLOD(lod: 0 | 1 | 2) { return `/geopolitical/world-territories-lod${lod}.geojson`; }
  private topologyFile() { return '/geopolitical/topology/world-borders.topology.json'; }
  private maritimeTopologyFile() { return '/geopolitical/maritime/topology/eez.topology.json'; }

  // Attempt to load pre-normalized artifact (WS1). Falls back silently if missing or malformed.
  private async tryLoadNormalizedBorders(lod: 0 | 1 | 2): Promise<ClassifiedLineFeature[] | null> {
    const url = this.normalizedBorderFileForLOD(lod);
    if (this.cache.has(url)) return this.cache.get(url) as ClassifiedLineFeature[];
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json || !Array.isArray(json.features)) return null;
      const mapClass = (c: string | undefined): BorderClassification => {
        switch ((c || '').toLowerCase()) {
          case 'international': return 'international';
          case 'disputed': return 'disputed';
          case 'lineofcontrol':
          case 'line_of_control': return 'line_of_control';
          case 'indefinite': return 'indefinite';
          default: return 'unknown';
        }
      };
      const features: ClassifiedLineFeature[] = json.features.map((f: any) => ({
        id: f.id,
        coordinates: f.coordinates,
        classification: mapClass(f.classification)
      }));
      this.cache.set(url, features);
      return features;
    } catch {
      return null;
    }
  }

  private async tryLoadTopologyLOD(lod: 0|1|2): Promise<ClassifiedLineFeature[] | null> {
    const topoUrl = this.topologyFile();
    const cacheKey = `${topoUrl}::lod${lod}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) as ClassifiedLineFeature[];
    try {
      const res = await fetch(topoUrl, { cache: 'no-cache' });
      if (!res.ok) return null;
      const topo = await res.json();
      if (!topo || !topo.lods || !topo.arcs) return null;
      const lodKey = `lod${lod}`;
      const lodData = topo.lods[lodKey];
      if (!lodData) return null;
      const arcs: number[][][] = topo.arcs;
      const features: ClassifiedLineFeature[] = lodData.features.map((f: any) => {
        const arcCoords = f.arcIndices.flatMap((ai: number) => arcs[ai]?.map((p: number[]) => [ (p[0]/topo.quantization)*360 - 180, (p[1]/topo.quantization)*180 - 90 ]) || []);
        return {
          id: f.id.toString(),
          coordinates: arcCoords,
          classification: ((): BorderClassification => {
            const c = (f.classification || '').toLowerCase();
            if (c === 'disputed') return 'disputed';
            if (c === 'lineofcontrol' || c === 'line_of_control') return 'line_of_control';
            if (c === 'indefinite') return 'indefinite';
            return 'international';
          })()
        };
      });
      this.cache.set(cacheKey, features);
      return features;
    } catch {
      return null;
    }
  }

  private async tryLoadMaritimeTopologyLOD(lod:0|1|2): Promise<MaritimeFeature[] | null> {
    const topoUrl = this.maritimeTopologyFile();
    const cacheKey = `${topoUrl}::lod${lod}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) as MaritimeFeature[];
    try {
      const res = await fetch(topoUrl, { cache: 'no-cache' });
      if (!res.ok) return null;
      const topo = await res.json();
      if (!topo || !topo.lods || !topo.arcs) return null;
      const lodKey = `lod${lod}`;
      const lodData = topo.lods[lodKey];
      if (!lodData) return null;
      const arcs: number[][][] = topo.arcs;
      const features: MaritimeFeature[] = lodData.features.map((f: any) => {
        const arcCoords = f.arcIndices.flatMap((ai: number) => arcs[ai]?.map((p: number[]) => [ (p[0]/topo.quantization)*360 - 180, (p[1]/topo.quantization)*180 - 90 ]) || []);
        const clsRaw = (f.classification || '').toLowerCase();
        const classification: BorderClassification = clsRaw === 'maritimeoverlap' || clsRaw === 'maritime_overlap' ? 'maritime_overlap' : 'maritime_eez';
        return { id: f.id.toString(), coordinates: arcCoords, classification };
      });
      this.cache.set(cacheKey, features);
      return features;
    } catch { return null; }
  }

  async loadBorders(url = '/geopolitical/world-borders.geojson'): Promise<ClassifiedLineFeature[]> {
    if (this.cache.has(url)) return this.cache.get(url) as ClassifiedLineFeature[];
    const res = await fetch(url);
    const geo = await res.json();
    // Build recognition matrix (cached internally for future analytics)
    const matrix = buildRecognitionMatrix(geo.features || []);
    this.cache.set(`${url}::matrix`, matrix);

    const features: ClassifiedLineFeature[] = (geo.features || [])
      .filter((f: any) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
      .flatMap((f: any) => {
        const baseId = f.properties?.BRK_A3 || f.id || 'border';
        const classification = normalizeFeatureCla(f.properties?.FEATURECLA);
        const build = (coords: any, idx?: number) => ({
          id: idx !== undefined ? `${baseId}:${idx}` : baseId,
            coordinates: coords,
            classification
        });
        if (f.geometry.type === 'LineString') return [build(f.geometry.coordinates)];
        if (f.geometry.type === 'MultiLineString') return f.geometry.coordinates.map((coords: any, idx: number) => build(coords, idx));
        return [];
      });
    this.cache.set(url, features);
    return features;
  }

  getRecognitionMatrix(url = '/geopolitical/world-borders.geojson'): RecognitionMatrixEntry[] | undefined {
    return this.cache.get(`${url}::matrix`) as RecognitionMatrixEntry[] | undefined;
  }

  async loadBordersLOD(lod: 0 | 1 | 2): Promise<LineFeature[]> {
    // Prefer topology -> normalized -> raw
    const topo = await this.tryLoadTopologyLOD(lod);
    if (topo) return topo;
    const normalized = await this.tryLoadNormalizedBorders(lod);
    if (normalized) return normalized;
    return this.loadBorders(this.borderFileForLOD(lod));
  }

  async loadTerritories(url = '/geopolitical/world-territories.geojson'): Promise<PolygonFeature[]> {
    if (this.cache.has(url)) return this.cache.get(url) as PolygonFeature[];
    const res = await fetch(url);
    const geo = await res.json();
    const features: PolygonFeature[] = (geo.features || [])
      .filter((f: any) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
      .flatMap((f: any) => {
        const idBase = f.properties?.ADM0_A3 || f.id || 'territory';
        if (f.geometry.type === 'Polygon') {
          return [{ id: idBase, rings: f.geometry.coordinates }];
        }
        // MultiPolygon: create a feature per polygon set
        return f.geometry.coordinates.map((poly: any, idx: number) => ({ id: `${idBase}:${idx}` , rings: poly }));
      });
    this.cache.set(url, features);
    return features;
  }

  async loadTerritoriesLOD(lod: 0 | 1 | 2): Promise<PolygonFeature[]> {
    return this.loadTerritories(this.territoryFileForLOD(lod));
  }

  async loadMaritimeBordersLOD(lod:0|1|2): Promise<MaritimeFeature[] | null> {
    return this.tryLoadMaritimeTopologyLOD(lod);
  }

  buildBorders(features: ClassifiedLineFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    const filtered = cfg.showDisputedTerritories ? features : features.filter(f => !isDisputed(f.classification));
    const group = GeometryFactory.buildBorderLines(filtered, { color: 0xffffff, opacity: cfg.borderVisibility / 100 });
    group.children.forEach(child => {
      if (child instanceof THREE.Line) {
        const featureId = child.name.replace('border:', '');
        const f = filtered.find(ft => `border:${ft.id}` === child.name);
        const params = resolveBorderMaterialConfig(cfg, featureId, f?.classification || 'international');
        (child as THREE.Line).material = createLineMaterial(params);
        child.userData.classification = f?.classification || 'international';
      }
    });
    return group;
  }

  buildTerritories(features: PolygonFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    return GeometryFactory.buildTerritoryPolygons(features, { color: 0x0044ff, opacity: cfg.territoryColors.opacity / 100 });
  }

  buildMaritimeBorders(features: MaritimeFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    const group = GeometryFactory.buildBorderLines(features, { color: 0x0094ff, opacity: cfg.borderVisibility / 100 });
    group.children.forEach(child => {
      if (child instanceof THREE.Line) {
        const f = features.find(ft => `border:${ft.id}` === child.name);
        const params = resolveBorderMaterialConfig(cfg, f?.id || 'maritime', f?.classification || 'maritime_eez');
        (child as THREE.Line).material = createLineMaterial(params);
      }
    });
    group.userData.maritime = true;
    return group;
  }
}

export const nationalTerritoriesService = new NationalTerritoriesService();
