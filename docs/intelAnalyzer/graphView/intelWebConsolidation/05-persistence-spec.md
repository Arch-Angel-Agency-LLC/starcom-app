# Persistence Spec

## Keys
- Views: `analyzer:graph:v2:${workspaceHash}:views`
- Last view: `analyzer:graph:v2:${workspaceHash}:lastView`
- Layout: `analyzer:graph:v1:${workspaceHash}:positions`

## Views v2 schema
```
{
  id: string,
  name: string,
  createdAt: number,
  filters: FilterState,
  showClusters: boolean,
  layoutFrozen: boolean,
  sizingMode: 'fixed' | 'degree',
  isolate?: { rootId: string; depth: number }
}
```

## Layout schema
```
{ [nodeId: string]: { x: number, y: number } }
```

## Migration
- No automatic migration from IntelWeb keys.
- Optional one-off import tool can translate IntelWeb views → Analyzer views.
