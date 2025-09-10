import { describe, it, expect, beforeEach } from 'vitest';
import { positionsKey, loadPositions, savePositions, clearPositions } from '../positionsStorage';

describe('positionsStorage', () => {
  const WH = 'ws-abc';
  const KEY = positionsKey(WH);

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no positions are saved', () => {
    expect(loadPositions(WH)).toBeNull();
  });

  it('saves and loads positions', () => {
    const map = { a: { x: 1, y: 2 }, b: { x: -3, y: 4.5 } };
    savePositions(WH, map);
    const loaded = loadPositions(WH);
    expect(loaded).toEqual(map);
  });

  it('clears positions', () => {
    savePositions(WH, { a: { x: 0, y: 0 } });
    clearPositions(WH);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(loadPositions(WH)).toBeNull();
  });

  it('scopes by workspace hash', () => {
    savePositions('ws-1', { x: { x: 1, y: 1 } });
    savePositions('ws-2', { x: { x: 2, y: 2 } });
    expect(loadPositions('ws-1')).toEqual({ x: { x: 1, y: 1 } });
    expect(loadPositions('ws-2')).toEqual({ x: { x: 2, y: 2 } });
  });

  it('returns null on invalid JSON', () => {
    localStorage.setItem(KEY, '{bad json');
    expect(loadPositions(WH)).toBeNull();
  });
});
