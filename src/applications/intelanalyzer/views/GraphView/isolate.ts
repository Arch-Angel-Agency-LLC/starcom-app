// Analyzer GraphView — Isolate BFS helper

type Endpoint = string | { id: string };
export interface GraphData {
  nodes: { id: string }[];
  links: { source: Endpoint; target: Endpoint }[];
}

function endpointId(ep: Endpoint): string {
  return typeof ep === 'string' ? ep : ep.id;
}

export function buildAdjacency(graph: GraphData): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const n of graph.nodes) adj.set(n.id, new Set());
  for (const e of graph.links) {
    const a = endpointId(e.source);
    const b = endpointId(e.target);
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }
  return adj;
}

export function isolateSubgraph(graph: GraphData, rootId: string, depth: number): GraphData {
  if (depth <= 0) {
    return { nodes: graph.nodes.filter(n => n.id === rootId), links: [] };
  }
  const adj = buildAdjacency(graph);
  if (!adj.has(rootId)) return { nodes: [], links: [] };
  const seen = new Set<string>([rootId]);
  const q: Array<{ id: string; d: number }> = [{ id: rootId, d: 0 }];
  while (q.length) {
    const { id, d } = q.shift()!;
    if (d === depth) continue;
    for (const nb of adj.get(id) || []) {
      if (!seen.has(nb)) {
        seen.add(nb);
        q.push({ id: nb, d: d + 1 });
      }
    }
  }
  const nodes = graph.nodes.filter(n => seen.has(n.id));
  const keep = new Set(nodes.map(n => n.id));
  const links = graph.links.filter(e => keep.has(endpointId(e.source)) && keep.has(endpointId(e.target)));
  return { nodes, links };
}
