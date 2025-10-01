import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { GeometryFactory } from '../geometryFactory.js';

function triangleCount(geom) {
  const idx = geom.getIndex();
  return idx ? idx.count / 3 : 0;
}

describe('GeometryFactory basic builds', () => {
  it('builds flat polygon', () => {
    const feature = {
      id: 'TEST_FLAT',
      rings: [ [ [-10,0], [0,10], [10,0], [0,-10], [-10,0] ] ]
    };
    const group = GeometryFactory.buildTerritoryPolygons([feature], { radius: 100, thickness: 0, elevation: 5 });
    expect(group.children.length).toBe(1);
    const mesh = group.children[0];
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    const geom = mesh.geometry;
    expect(triangleCount(geom)).toBeGreaterThan(0);
  });

  it('builds extruded polygon with hole walls', () => {
    const feature = {
      id: 'TEST_EXTRUDE',
      rings: [
        [ [0,0],[4,0],[4,4],[0,4],[0,0] ],
        [ [1,1],[1,2],[2,2],[2,1],[1,1] ]
      ]
    };
    const group = GeometryFactory.buildTerritoryPolygons([feature], { radius: 100, thickness: 2, elevation: 5 });
    const mesh = group.children[0];
    const geom = mesh.geometry;
    expect(triangleCount(geom)).toBeGreaterThan(40); // heuristic indicating walls added
  });

  it('applies fallback for wide polygon when enabled', () => {
    global.window = { location: { search: '?geoPolyFallback=1' } };
    const feature = { id: 'WIDE_FALLBACK', rings: [ [ [-179,0], [-120,5], [-60,-5], [0,5], [60,-5], [120,5], [179,-5], [-179,0] ] ] };
    const group = GeometryFactory.buildTerritoryPolygons([feature], { radius: 100, thickness: 0 });
    const mesh = group.children[0];
    const geom = mesh.geometry;
    const pos = geom.getAttribute('position');
    expect(pos).toBeDefined();
    expect(pos.count).toBeGreaterThan(10);
  });
});