import { describe, it, expect } from 'vitest';
import { latLonToVector3 } from '../utils/latLonToVector3';

describe('latLonToVector3', () => {
  it('projects equator point (0,0) with invertX default to negative X axis', () => {
    const v = latLonToVector3(0,0,{ radius: 10 });
    expect(Math.round(v.x)).toBe(-10);
    expect(Math.round(v.y)).toBe(0);
  });
  it('respects invertX=false producing positive X', () => {
    const v = latLonToVector3(0,0,{ radius: 10, invertX: false });
    expect(Math.round(v.x)).toBe(10);
  });
  it('adds elevation to radius length', () => {
    const v = latLonToVector3(45,45,{ radius: 10, elevation: 2 });
    expect(v.length()).toBeGreaterThan(10);
  });
});
