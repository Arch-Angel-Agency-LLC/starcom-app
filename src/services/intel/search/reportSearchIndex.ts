// reportSearchIndex.ts - lightweight in-memory search index for IntelReportUI
// AND semantics across query tokens. Ranking weights configurable.

import { IntelReportUI } from '../../../types/intel/IntelReportUI';

export interface ReportSearchIndexEntry {
  id: string;
  tokenWeights: Record<string, number>; // token -> cumulative weight
  length: number; // number of distinct tokens (for potential normalization)
}

export interface ReportSearchIndex {
  entries: ReportSearchIndexEntry[];
  tokenToDocIds: Record<string, Set<string>>; // inverted map
  weights: typeof DEFAULT_WEIGHTS;
}

const DEFAULT_WEIGHTS = {
  title: 3,
  tags: 2,
  summary: 1,
  content: 1,
  conclusions: 1,
  recommendations: 1,
  methodology: 1
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function buildIndex(reports: IntelReportUI[], weights = DEFAULT_WEIGHTS): ReportSearchIndex {
  const entries: ReportSearchIndexEntry[] = [];
  const tokenToDocIds: Record<string, Set<string>> = {};

  for (const r of reports) {
    const tokenWeights: Record<string, number> = {};
    const addTokens = (tokens: string[], w: number) => {
      for (const t of tokens) {
        tokenWeights[t] = (tokenWeights[t] || 0) + w;
      }
    };
    addTokens(tokenize(r.title), weights.title);
    if (r.tags) addTokens(r.tags.map(t=>t.toLowerCase()), weights.tags);
    if (r.summary) addTokens(tokenize(r.summary), weights.summary);
    addTokens(tokenize(r.content), weights.content);
    if (r.conclusions) for (const c of r.conclusions) addTokens(tokenize(c), weights.conclusions);
    if (r.recommendations) for (const rec of r.recommendations) addTokens(tokenize(rec), weights.recommendations);
    if (r.methodology) for (const m of r.methodology) addTokens(tokenize(m), weights.methodology);

    const entry: ReportSearchIndexEntry = { id: r.id, tokenWeights, length: Object.keys(tokenWeights).length };
    entries.push(entry);
    for (const token of Object.keys(tokenWeights)) {
      if (!tokenToDocIds[token]) tokenToDocIds[token] = new Set();
      tokenToDocIds[token].add(r.id);
    }
  }
  return { entries, tokenToDocIds, weights };
}

export interface SearchResult { id: string; score: number; }

export function search(index: ReportSearchIndex, query: string): SearchResult[] {
  const rawTokens = tokenize(query);
  const tokens = Array.from(new Set(rawTokens));
  if (tokens.length === 0) return index.entries.map(e => ({ id: e.id, score: 0 }));

  // AND semantics: start with set of docs containing first token
  let candidateIds: Set<string> | null = null;
  for (const t of tokens) {
    const docs = index.tokenToDocIds[t];
    if (!docs) return []; // token not present anywhere => no matches
    candidateIds = candidateIds ? intersect(candidateIds, docs) : new Set(docs);
    if (candidateIds.size === 0) return [];
  }
  if (!candidateIds) return [];

  // Score candidates by summing token weights (could add normalization later)
  const scores: SearchResult[] = [];
  for (const id of candidateIds) {
    const entry = index.entries.find(e => e.id === id)!;
    let score = 0;
    for (const t of tokens) {
      score += entry.tokenWeights[t] || 0;
    }
    scores.push({ id, score });
  }
  return scores.sort((a,b)=> b.score - a.score || a.id.localeCompare(b.id));
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const out = new Set<string>();
  // iterate smaller set
  const small = a.size < b.size ? a : b;
  const large = a.size < b.size ? b : a;
  for (const v of small) if (large.has(v)) out.add(v);
  return out;
}
