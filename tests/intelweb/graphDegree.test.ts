import { describe, it, expect } from 'vitest';

interface TestNode { id: string; }
interface TestEdge { source: string; target: string; }

function computeDegrees(nodes: TestNode[], edges: TestEdge[]): Record<string, number> {
  const degree: Record<string, number> = {};
  nodes.forEach(n => degree[n.id] = 0);
  edges.forEach(e => { degree[e.source] = (degree[e.source]||0)+1; degree[e.target] = (degree[e.target]||0)+1; });
  return degree;
}

describe('Degree computation', () => {
  it('computes correct degrees for simple graph', () => {
    const nodes = [{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
    const edges = [
      {source:'a', target:'b'},
      {source:'b', target:'c'},
      {source:'c', target:'d'},
      {source:'a', target:'d'}
    ];
    const deg = computeDegrees(nodes, edges);
    expect(deg).toEqual({ a:2, b:2, c:2, d:2 });
  });
});
