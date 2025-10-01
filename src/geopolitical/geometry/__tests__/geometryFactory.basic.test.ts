import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { GeometryFactory, type PolygonFeature } from '../geometryFactory';

// Utility to count side wall quads for outer ring (approx) for extruded forms
function triangleCount(geom: THREE.BufferGeometry): number {
  const idx = geom.getIndex();
  return idx ? idx.count / 3 : 0;
}

describe('GeometryFactory basic polygon builds', () => {
  it('builds flat legacy polygon', () => {
    const feature: PolygonFeature = {
      id: 'TEST1',
      rings: [
        [ [-10,0], [0,10], [10,0], [0,-10], [-10,0] ]
      ]
    } as any;
    const group = GeometryFactory.buildTerritoryPolygons([feature], { radius: 100, thickness: 0, elevation: 5 });
    expect(group.children.length).toBe(1);
    const mesh = group.children[0] as THREE.Mesh;
    const geom = mesh.geometry as THREE.BufferGeometry;
    expect(triangleCount(geom)).toBeGreaterThan(0);
  });

  it('builds extruded polygon with hole side walls', () => {
    // Square outer with small square hole
    const feature: PolygonFeature = {
      id: 'EXTRUDE1',
      rings: [
        [ [0,0],[4,0],[4,4],[0,4],[0,0] ],
        [ [1,1],[1,2],[2,2],[2,1],[1,1] ]
      ]
    } as any;
    const group = GeometryFactory.buildTerritoryPolygons([feature], { radius: 100, thickness: 2, elevation: 5 });
    const mesh = group.children[0] as THREE.Mesh;
    const geom = mesh.geometry as THREE.BufferGeometry;
    const tri = triangleCount(geom);
    // Expect additional triangles beyond simple top/bottom due to outer + hole walls
    expect(tri).toBeGreaterThan(40); // heuristic lower bound
  });

  it('applies fallback for wide polygon when enabled', () => {
    (globalThis as any).window = { location: { search: '?geoPolyFallback=1' } };
    const feature: PolygonFeature = { id: 'WIDE', rings: [ [ [-179,0],[-120,5],[-60,-5],[0,5],[60,-5],[120,5],[179,-5],[-179,0] ] ] } as any;
    const group = GeometryFactory.buildTerritoryPolygons([feature], { radius: 100, thickness: 0 });
    const mesh = group.children[0] as THREE.Mesh;
    const geom = mesh.geometry as THREE.BufferGeometry;
    const pos = geom.getAttribute('position');
    expect(pos).toBeDefined();
    expect(pos!.count).toBeGreaterThan(10);
  });
});
