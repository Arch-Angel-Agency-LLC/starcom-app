// NationalTerritoriesService: loads and builds border / territory geometry
import * as THREE from 'three';
import { GeometryFactory, LineFeature, PolygonFeature } from '../geometry/geometryFactory';
import { GeoPoliticalConfig } from '../../../hooks/useGeoPoliticalSettings';
import { resolveBorderMaterialConfig, createLineMaterial } from '../theme/materialTheme';

export interface WorldBordersData { features: Array<{ id: string; coordinates: [number, number][] }> }
export interface WorldTerritoriesData { features: Array<{ id: string; rings: [number, number][][] }> }

export class NationalTerritoriesService {
  private cache: Map<string, unknown> = new Map();

  async loadBorders(url = '/borders.geojson'): Promise<LineFeature[]> {
    if (this.cache.has(url)) return this.cache.get(url) as LineFeature[];
    const res = await fetch(url);
    const geo = await res.json();
    const features: LineFeature[] = (geo.features || [])
      .filter((f: any) => f.geometry?.type === 'LineString')
      .map((f: any) => ({ id: f.properties?.name || f.id || 'border', coordinates: f.geometry.coordinates }));
    this.cache.set(url, features);
    return features;
  }

  async loadTerritories(url = '/territories.geojson'): Promise<PolygonFeature[]> {
    if (this.cache.has(url)) return this.cache.get(url) as PolygonFeature[];
    const res = await fetch(url);
    const geo = await res.json();
    const features: PolygonFeature[] = (geo.features || [])
      .filter((f: any) => f.geometry?.type === 'Polygon')
      .map((f: any) => ({ id: f.properties?.name || f.id || 'territory', rings: f.geometry.coordinates }));
    this.cache.set(url, features);
    return features;
  }

  buildBorders(features: LineFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    const group = GeometryFactory.buildBorderLines(features, { color: 0xffffff, opacity: cfg.borderVisibility / 100 });
    // Replace per-line material colors with scheme-driven colors
    group.children.forEach(child => {
      if (child instanceof THREE.Line) {
        const params = resolveBorderMaterialConfig(cfg, child.name);
        (child as THREE.Line).material = createLineMaterial(params);
      }
    });
    return group;
  }

  buildTerritories(features: PolygonFeature[], cfg: GeoPoliticalConfig['nationalTerritories']): THREE.Group {
    // Basic fill: use color scheme hashed by feature id
    return GeometryFactory.buildTerritoryPolygons(features, { color: 0x0044ff, opacity: cfg.territoryColors.opacity / 100 });
  }
}

export const nationalTerritoriesService = new NationalTerritoriesService();
