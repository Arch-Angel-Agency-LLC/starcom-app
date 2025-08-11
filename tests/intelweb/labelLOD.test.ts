import { describe, it, expect } from 'vitest';

function selectLabelSet(idsByDegree: string[], zoom: number, maxZoomedOut = 30, threshold = 0.5): Set<string> {
  const allowed = new Set<string>();
  if (zoom >= threshold) {
    idsByDegree.forEach(id => allowed.add(id));
  } else {
    idsByDegree.slice(0, maxZoomedOut).forEach(id => allowed.add(id));
  }
  return allowed;
}

describe('Label LOD', () => {
  const ids = Array.from({length:100}, (_,i)=>`n${i}`);
  it('limits labels when zoomed out', () => {
    const allowed = selectLabelSet(ids, 0.2, 30, 0.5);
    expect(allowed.size).toBe(30);
  });
  it('shows all when zoomed in past threshold', () => {
    const allowed = selectLabelSet(ids, 0.8, 30, 0.5);
    expect(allowed.size).toBe(100);
  });
});
