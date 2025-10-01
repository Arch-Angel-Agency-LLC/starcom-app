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

type AnyGeoFeature = { id?: string; properties?: Record<string, unknown>; geometry?: { type: string; coordinates: unknown } };
type LineStringGeom = { type: 'LineString'; coordinates: [number, number][] };
type MultiLineStringGeom = { type: 'MultiLineString'; coordinates: [number, number][][] };
type PolygonGeom = { type: 'Polygon'; coordinates: [number, number][][] };
type MultiPolygonGeom = { type: 'MultiPolygon'; coordinates: [number, number][][][] };

function buildRecognitionMatrix(rawFeatures: AnyGeoFeature[]): RecognitionMatrixEntry[] {
  return rawFeatures.map(f => {
    const props = (f.properties || {}) as Record<string, unknown>;
    const classification = normalizeFeatureCla(typeof props.FEATURECLA === 'string' ? props.FEATURECLA : undefined);
    const perspectives: Record<string, PerspectiveRecognition> = {};
    Object.keys(props).forEach(k => {
      if (k.startsWith('FCLASS_')) {
        perspectives[k.substring('FCLASS_'.length)] = normalizePerspectiveValue(typeof props[k] === 'string' ? (props[k] as string) : undefined);
      }
    });
    const id = (typeof props.NE_ID === 'string' && props.NE_ID)
      || (typeof props.BRK_A3 === 'string' && props.BRK_A3)
      || f.id
      || 'border';
    return { featureId: String(id), classification, perspectives };
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
  const features: ClassifiedLineFeature[] = json.features.map((f: { id: string; coordinates: [number, number][]; classification?: string }) => ({
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
  const features: ClassifiedLineFeature[] = lodData.features.map((f: { id: string | number; arcIndices: number[]; classification?: string }) => {
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
  const features: MaritimeFeature[] = lodData.features.map((f: { id: string | number; arcIndices: number[]; classification?: string }) => {
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
      .filter((f: AnyGeoFeature) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
      .flatMap((f: AnyGeoFeature) => {
        const props = (f.properties || {}) as Record<string, unknown>;
        const baseId = (typeof props.BRK_A3 === 'string' && props.BRK_A3) || f.id || 'border';
        const classification = normalizeFeatureCla(typeof props.FEATURECLA === 'string' ? props.FEATURECLA : undefined);
        const build = (coords: [number, number][], idx?: number): ClassifiedLineFeature => ({
          id: idx !== undefined ? `${baseId}:${idx}` : String(baseId),
          coordinates: coords,
          classification
        });
        if (f.geometry?.type === 'LineString') {
          const g = f.geometry as LineStringGeom;
          return [build(g.coordinates)];
        }
        if (f.geometry?.type === 'MultiLineString') {
          const g = f.geometry as MultiLineStringGeom;
          return g.coordinates.map((coords, idx) => build(coords, idx));
        }
        return [];
      });
    this.cache.set(url, features);
    return features;
  }

  getRecognitionMatrix(url = '/geopolitical/world-borders.geojson'): RecognitionMatrixEntry[] | undefined {
    return this.cache.get(`${url}::matrix`) as RecognitionMatrixEntry[] | undefined;
  }

  async loadBordersLOD(lod: 0 | 1 | 2): Promise<ClassifiedLineFeature[]> {
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
      .filter((f: AnyGeoFeature) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
      .flatMap((f: AnyGeoFeature) => {
        const props = (f.properties || {}) as Record<string, unknown>;
        const idBase = (typeof props.ADM0_A3 === 'string' && props.ADM0_A3) || f.id || 'territory';
        if (f.geometry?.type === 'Polygon') {
          const g = f.geometry as PolygonGeom;
          return [{ id: String(idBase), rings: g.coordinates }];
        }
        if (f.geometry?.type === 'MultiPolygon') {
          const g = f.geometry as MultiPolygonGeom;
          return g.coordinates.map((poly, idx) => ({ id: `${String(idBase)}:${idx}`, rings: poly }));
        }
        return [];
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
        const classification = (f?.classification || 'international') as BorderClassification;
        const params = resolveBorderMaterialConfig(cfg, featureId, classification);
        const mat = createLineMaterial(params);
        mat.depthWrite = false; // Enforce overlay line rendering does not write depth
        (child as THREE.Line).material = mat;
        const priority = classification === 'disputed' ? 3
          : classification === 'line_of_control' ? 3
          : classification === 'maritime_overlap' ? 2
          : classification === 'maritime_eez' ? 1
          : 0;
        child.renderOrder = 100 + priority; // base 100, layered within borders
        child.userData.classification = classification;
      }
    });
    return group;
  }

  buildTerritories(features: PolygonFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    // Apply config-driven rendering flags
    return GeometryFactory.buildTerritoryPolygons(features, {
      color: 0x0044ff,
      opacity: cfg.territoryColors.opacity / 100,
  // If user did not specify, let GeometryFactory apply dynamic default (0.5% radius)
  elevation: typeof cfg.fillElevationEpsilon === 'number' ? cfg.fillElevationEpsilon : undefined,
  side: (cfg.frontSideOnly ? THREE.FrontSide : THREE.DoubleSide),
  usePolygonOffset: cfg.usePolygonOffset ?? true,
  polygonOffsetFactor: cfg.polygonOffsetFactor ?? -1.5,
  polygonOffsetUnits: cfg.polygonOffsetUnits ?? -1.5
    });
  }

  buildMaritimeBorders(features: MaritimeFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    const group = GeometryFactory.buildBorderLines(features, { color: 0x0094ff, opacity: cfg.borderVisibility / 100 });
    group.children.forEach(child => {
      if (child instanceof THREE.Line) {
        const f = features.find(ft => `border:${ft.id}` === child.name);
  const classification = (f?.classification || 'maritime_eez') as BorderClassification;
  const params = resolveBorderMaterialConfig(cfg, f?.id || 'maritime', classification);
  const mat = createLineMaterial(params);
  mat.depthWrite = false; // Enforce overlay line rendering does not write depth
  (child as THREE.Line).material = mat;
  const priority = classification === 'maritime_overlap' ? 2 : 1;
  child.renderOrder = 98 + priority; // maritime base below borders base
  child.userData.classification = classification;
      }
    });
    group.userData.maritime = true;
    return group;
  }
}

export const nationalTerritoriesService = new NationalTerritoriesService();
