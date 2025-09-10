# Data Contracts

## Graph data
- Node: `{ id: string; type: 'event'|'entity'|'tag'; label?: string; size?: number; fx?: number; fy?: number }`
- Link: `{ source: string; target: string; co?: boolean; tco?: boolean; count?: number }`

## Filters (Analyzer FilterState)
- `timeRange?: { start: Date; end: Date }`
- `tags?: string[]`
- `entityRefs?: string[]`
- `categories?: string[]`
- `confidence?: { min: number; max: number }`
- `geo?: { polygon: [number, number][] }`
- Plus `showClusters: boolean` from CorrelationContext

## Isolate state
- `{ rootId: string | null; depth: number; active: boolean }`

## Persistence keying
- `workspaceHash: string`
  - Prefer an explicit workspace id if available.
  - Fallback to a stable hash derived from dataset identity.

## Storage keys
- Views: `analyzer:graph:v2:${workspaceHash}:views`
- Last view: `analyzer:graph:v2:${workspaceHash}:lastView`
- Layout: `analyzer:graph:v1:${workspaceHash}:positions`
