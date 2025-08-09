// GeometryFactory: utilities to build line and polygon groups for geopolitical layers
import * as THREE from 'three';
import { latLonToVector3 } from '../utils/latLonToVector3';
import { clearGroup } from '../utils/disposal';

export interface LineFeature {
  id: string;
  coordinates: [number, number][]; // [lng, lat]
}

export interface PolygonFeature {
  id: string;
  // First ring outer boundary; subsequent (optional) inner holes
  rings: [number, number][][]; // array of rings -> array of [lng, lat]
}

export interface BorderBuildOptions {
  radius?: number;
  elevation?: number;
  color?: number;
  opacity?: number;
}

export interface TerritoryFillOptions {
  radius?: number;
  elevation?: number;
  color?: number;
  opacity?: number;
  side?: THREE.Side;
}

export const GeometryFactory = {
  buildBorderLines(features: LineFeature[], opts: BorderBuildOptions = {}): THREE.Group {
    const group = new THREE.Group();
    const { radius = 100, elevation = 0.2, color = 0x00ff41, opacity = 0.85 } = opts;
    features.forEach(f => {
      if (!Array.isArray(f.coordinates) || f.coordinates.length < 2) return;
      const pts = f.coordinates.map(([lng, lat]) => latLonToVector3(lat, lng, { radius, elevation }));
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      const line = new THREE.Line(geom, mat);
      line.name = `border:${f.id}`;
      group.add(line);
    });
    return group;
  },

  buildTerritoryPolygons(features: PolygonFeature[], opts: TerritoryFillOptions = {}): THREE.Group {
    const group = new THREE.Group();
    const { radius = 100, elevation = 0.1, color = 0x0044ff, opacity = 0.4, side = THREE.DoubleSide } = opts;
    features.forEach(f => {
      if (!Array.isArray(f.rings) || f.rings.length === 0) return;
      const outer = f.rings[0];
      if (outer.length < 3) return;
      const shapePoints2D: THREE.Vector2[] = [];
      outer.forEach(([lng, lat]) => {
        // Project to 3D then flatten to local tangent plane approximation (simple equirectangular flatten for now)
        // For MVP: we approximate by ignoring curvature within small polygon extents.
        shapePoints2D.push(new THREE.Vector2(lng, lat));
      });
      const shape = new THREE.Shape(shapePoints2D);
      // Holes
      for (let i = 1; i < f.rings.length; i++) {
        const hole = f.rings[i];
        if (hole.length < 3) continue;
        const path = new THREE.Path();
        hole.forEach(([lng, lat], idx) => {
          const v = new THREE.Vector2(lng, lat);
          if (idx === 0) path.moveTo(v.x, v.y); else path.lineTo(v.x, v.y);
        });
        shape.holes.push(path);
      }
      // Extrude shape very lightly then project vertices onto sphere
      const geom = new THREE.ShapeGeometry(shape, 8);
      // Reproject vertices to sphere surface (approx: interpret x=lng, y=lat)
      const pos = geom.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const lng = pos.getX(i);
        const lat = pos.getY(i);
        const v3 = latLonToVector3(lat, lng, { radius, elevation });
        pos.setXYZ(i, v3.x, v3.y, v3.z);
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side, depthWrite: false });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `territory:${f.id}`;
      group.add(mesh);
    });
    return group;
  },

  disposeGroup(group: THREE.Group) {
    clearGroup(group);
  }
};
