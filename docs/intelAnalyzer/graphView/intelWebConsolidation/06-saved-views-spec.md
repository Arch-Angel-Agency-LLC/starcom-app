# Saved Views Spec

## Purpose
Persist named graph view configurations per workspace to quickly switch analysis contexts.

## Data Model (v2)
- id: string (uuid)
- name: string (1..60 chars)
- createdAt: number (epoch ms)
- filters: FilterState
- showClusters: boolean
- layoutFrozen: boolean
- sizingMode: 'fixed' | 'degree'
- isolate?: { rootId: string; depth: number }

Notes:
- Camera state and panel positions are not persisted in v2; consider v3 if needed.

## Storage
- Key: `analyzer:graph:v2:${workspaceHash}:views`
- Value: Array<ViewV2>
- Last applied view key: `analyzer:graph:v2:${workspaceHash}:lastView`

## Operations
- list(): ViewV2[]
- create(input): ViewV2
- update(id, patch): ViewV2
- remove(id)
- apply(id): side-effects set FilterContext, sizing mode, cluster vis, isolate; then optionally freeze layout

## Validation
- Unique name per workspace (case-insensitive)
- Depth in [0..5] (configurable), rootId must exist in current graph to apply isolate

## Error Modes
- On missing id: return NotFound
- On invalid state: ValidationError; do not write partial state

## Migration
- No auto migration from IntelWeb saved views. Provide optional import script.
