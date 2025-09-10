import { describe, it, expect } from 'vitest';
import { isolateSubgraph } from '../isolate';

const graph = {
  nodes: [
    { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }
  ],
  links: [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' },
    { source: 'c', target: 'd' },
  ]
};

describe('isolateSubgraph', () => {
  it('depth 0 returns only root', () => {
    const sub = isolateSubgraph(graph, 'b', 0);
    expect(sub.nodes.map(n => n.id)).toEqual(['b']);
    expect(sub.links.length).toBe(0);
  });

  it('depth 1 returns neighbors', () => {
    const sub = isolateSubgraph(graph, 'b', 1);
    expect(new Set(sub.nodes.map(n => n.id))).toEqual(new Set(['a','b','c']));
    // Should include links among included nodes
    expect(sub.links.length).toBe(2);
  });

  it('nonexistent root returns empty', () => {
    const sub = isolateSubgraph(graph, 'x', 2);
    expect(sub.nodes.length).toBe(0);
    expect(sub.links.length).toBe(0);
  });
});
