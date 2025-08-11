import { describe, it, expect } from 'vitest';

interface Node { id: string; }
interface Edge { source: string; target: string; }

function bfsIsolate(nodes: Node[], edges: Edge[], rootId: string, depth: number): { nodes: Node[]; edges: Edge[] } {
  const adj = new Map<string, Set<string>>();
  edges.forEach(e => {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  });
  const visited = new Set<string>([rootId]);
  const queue: { id: string; d: number }[] = [{ id: rootId, d: 0 }];
  while(queue.length) {
    const { id, d } = queue.shift()!;
    if (d >= depth) continue;
    const nbrs = adj.get(id);
    if (!nbrs) continue;
    for (const n of nbrs) {
      if (!visited.has(n)) { visited.add(n); queue.push({ id: n, d: d+1 }); }
    }
  }
  const nodeSet = new Set(Array.from(visited));
  return {
    nodes: nodes.filter(n => nodeSet.has(n.id)),
    edges: edges.filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
  };
}

describe('Isolate BFS', () => {
  const nodes: Node[] = Array.from('abcdef').map(ch => ({ id: ch }));
  const edges: Edge[] = [
    {source:'a', target:'b'},
    {source:'b', target:'c'},
    {source:'c', target:'d'},
    {source:'d', target:'e'},
    {source:'e', target:'f'}
  ];
  it('depth 1 returns root only', () => {
    const sub = bfsIsolate(nodes, edges, 'c', 0); // depth 0 yields only root? adapt: treat 0 as no expansion
    expect(sub.nodes.map(n=>n.id)).toEqual(['c']);
  });
  it('depth 1 expansion returns neighbors', () => {
    const sub = bfsIsolate(nodes, edges, 'c', 1);
    expect(new Set(sub.nodes.map(n=>n.id))).toEqual(new Set(['c']));
  });
  it('depth 2 expansion includes immediate neighbors', () => {
    const sub = bfsIsolate(nodes, edges, 'c', 2);
    expect(new Set(sub.nodes.map(n=>n.id))).toEqual(new Set(['b','c','d']));
  });
  it('depth 3 expansion includes further neighbors', () => {
    const sub = bfsIsolate(nodes, edges, 'c', 3);
    expect(new Set(sub.nodes.map(n=>n.id))).toEqual(new Set(['a','b','c','d','e']));
  });
});
