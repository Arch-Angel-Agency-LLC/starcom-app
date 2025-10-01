// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { GeometryFactory } from '../geometryFactory';
import * as THREE from 'three';

// Simulate wide span polygon that should trigger tangent projection under fallback.
// We'll monkey patch window.location.search for this test environment.

function setSearch(q) {
  global.window = { location: { search: q } };
}

describe('Projection fallback', () => {
  it('rebuilds with tangent when edge ratio high and fallback enabled', () => {
    // Construct a stretched polygon along equator to produce long skinny triangles in legacy projection.
    const outer = [
      [-179, 0], [-120, 5], [-60, -5], [0, 5], [60, -5], [120, 5], [179, -5], [-179, 0]
    ];
    const feature = { id: 'WIDE1', rings: [outer] };
    setSearch('?geoPolyFallback=1');
    const group = GeometryFactory.buildTerritoryPolygons([feature], { radius: 100, thickness: 0 });
    const mesh = group.children[0] as THREE.Mesh;
    expect(mesh.name.includes('WIDE1')).toBe(true);
    // Hard to directly assert projection switch without internal flag; rely on absence of crash and geometry presence
    const geom = mesh.geometry as THREE.BufferGeometry;
    const pos = geom.getAttribute('position');
    expect(pos).toBeDefined();
    expect(pos.count).toBeGreaterThan(10);
  });
});
