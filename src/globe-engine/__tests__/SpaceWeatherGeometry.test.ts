import { describe, expect, it, vi } from 'vitest';
import { BufferGeometry } from 'three';
import {
  AURORA_POINT_CAP,
  countVertices,
  createAuroraBlackoutMesh,
  createAuroraLines,
  createBowShockMesh,
  createMagnetopauseMesh,
  logVertexCount
} from '../SpaceWeatherGeometry';
import { buildAuroralPayload } from '../../services/SpaceWeatherModeling';

const makeMagnetopausePayload = () => ({ standoffRe: 10.5, lastUpdated: '2024-01-01T00:00:00Z', quality: 'live' as const });
const makeBowShockPayload = () => ({ radiusRe: 14.2, lastUpdated: '2024-01-01T00:00:00Z', quality: 'live' as const });

const buildAuroraPayload = () => buildAuroralPayload({ kp: 4, timestamp: '2024-01-01T00:00:00Z' }, 'live');

const getVertexCount = (geometry: BufferGeometry) => geometry.getAttribute('position').count;

describe('SpaceWeatherGeometry render ordering and sizing', () => {
  it('keeps shell meshes under vertex cap and sets render order to 2', () => {
    const magnetopause = createMagnetopauseMesh(makeMagnetopausePayload());
    const bowShock = createBowShockMesh(makeBowShockPayload());

    expect(magnetopause.renderOrder).toBe(2);
    expect(bowShock.renderOrder).toBe(2);

    expect(getVertexCount(magnetopause.geometry)).toBeLessThanOrEqual(5000);
    expect(getVertexCount(bowShock.geometry)).toBeLessThanOrEqual(5000);
  });

  it('sets aurora line and blackout mesh render orders to avoid z-fighting', () => {
    const aurora = buildAuroraPayload();
    const lines = createAuroraLines(aurora);
    const blackout = createAuroraBlackoutMesh(aurora);

    expect(lines.north.renderOrder).toBe(1);
    expect(lines.south.renderOrder).toBe(1);
    expect(blackout.renderOrder).toBeCloseTo(0.5);
  });

  it('counts vertices and logs via helper', () => {
    const magnetopause = createMagnetopauseMesh(makeMagnetopausePayload());
    const logger = vi.fn();

    const total = logVertexCount('magnetopause', magnetopause, logger);

    expect(total).toBe(countVertices(magnetopause));
    expect(logger).toHaveBeenCalledWith('magnetopause', total);
  });

  it('downsamples oversized aurora polylines to stay under caps and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const longNorth = Array.from({ length: 2000 }, (_, i) => ({ lat: 60, lng: -180 + i * 0.18 }));
    longNorth.push(longNorth[0]);
    const longSouth = longNorth.map((p) => ({ ...p, lat: -p.lat }));
    const payload = {
      oval: { north: longNorth, south: longSouth },
      kp: 6,
      blackout: { thresholdKp: 7, gradient: { inner: 0.35, outer: 0.65 } },
      lastUpdated: '2024-01-01T00:00:00Z',
      quality: 'live' as const
    };

    const lines = createAuroraLines(payload);
    const blackout = createAuroraBlackoutMesh(payload);

    expect(lines.north.geometry.getAttribute('position').count).toBeLessThanOrEqual(AURORA_POINT_CAP);
    expect(lines.south.geometry.getAttribute('position').count).toBeLessThanOrEqual(AURORA_POINT_CAP);
    expect(blackout.geometry.getAttribute('position').count).toBeLessThanOrEqual((AURORA_POINT_CAP + 1) * 2);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
