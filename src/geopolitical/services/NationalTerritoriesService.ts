// NationalTerritoriesService: loads and builds border / territory geometry
import * as THREE from 'three';
import { GeometryFactory, LineFeature, PolygonFeature } from '../geometry/geometryFactory';
import { GeoPoliticalConfig } from '../../../hooks/useGeoPoliticalSettings';
import { resolveBorderMaterialConfig, createLineMaterial } from '../theme/materialTheme';

export interface WorldBordersData { features: Array<{ id: string; coordinates: [number, number][] }> }
export interface WorldTerritoriesData { features: Array<{ id: string; rings: [number, number][][] }> }

export class NationalTerritoriesService {
  private cache: Map<string, unknown> = new Map();

  private borderFileForLOD(lod: 0 | 1 | 2) { return `/geopolitical/world-borders-lod${lod}.geojson`; }
  private territoryFileForLOD(lod: 0 | 1 | 2) { return `/geopolitical/world-territories-lod${lod}.geojson`; }

  async loadBorders(url = '/geopolitical/world-borders.geojson'): Promise<LineFeature[]> {
    if (this.cache.has(url)) return this.cache.get(url) as LineFeature[];
    const res = await fetch(url);
    const geo = await res.json();
    const features: LineFeature[] = (geo.features || [])
      .filter((f: any) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
      .flatMap((f: any) => {
        if (f.geometry.type === 'LineString') return [{ id: f.properties?.BRK_A3 || f.id || 'border', coordinates: f.geometry.coordinates }];
        if (f.geometry.type === 'MultiLineString') return f.geometry.coordinates.map((coords: any, idx: number) => ({ id: (f.properties?.BRK_A3 || f.id || 'border') + ':' + idx, coordinates: coords }));
        return [];
      });
    this.cache.set(url, features);
    return features;
  }

  async loadBordersLOD(lod: 0 | 1 | 2): Promise<LineFeature[]> {
    return this.loadBorders(this.borderFileForLOD(lod));
  }

  async loadTerritories(url = '/geopolitical/world-territories.geojson'): Promise<PolygonFeature[]> {
    if (this.cache.has(url)) return this.cache.get(url) as PolygonFeature[];
    const res = await fetch(url);
    const geo = await res.json();
    const features: PolygonFeature[] = (geo.features || [])
      .filter((f: any) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
      .map((f: any) => ({ id: f.properties?.ADM0_A3 || f.id || 'territory', rings: (f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates[0]) }));
    this.cache.set(url, features);
    return features;
  }

  async loadTerritoriesLOD(lod: 0 | 1 | 2): Promise<PolygonFeature[]> {
    return this.loadTerritories(this.territoryFileForLOD(lod));
  }

  buildBorders(features: LineFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    const group = GeometryFactory.buildBorderLines(features, { color: 0xffffff, opacity: cfg.borderVisibility / 100 });
    group.children.forEach(child => {
      if (child instanceof THREE.Line) {
        const params = resolveBorderMaterialConfig(cfg, child.name);
        (child as THREE.Line).material = createLineMaterial(params);
      }
    });
    return group;
  }

  buildTerritories(features: PolygonFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    return GeometryFactory.buildTerritoryPolygons(features, { color: 0x0044ff, opacity: cfg.territoryColors.opacity / 100 });
  }
}

export const nationalTerritoriesService = new NationalTerritoriesService();
